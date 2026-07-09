import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const period = searchParams.get('period');
  const category = searchParams.get('category');
  const bank = searchParams.get('bank');

  const rows = await sql`
    SELECT id, user_id, date, description, bank, period, value, category, created_at, account_type
    FROM transactions
    WHERE user_id = ${userId}
      AND (${period}::text IS NULL OR period = ${period})
      AND (${category}::text IS NULL OR category = ${category})
      AND (${bank}::text IS NULL OR bank = ${bank})
    ORDER BY period DESC, date DESC, id DESC
  `;
  return NextResponse.json(rows);
}

// Chave usada para considerar um lançamento "o mesmo" já existente. Precisa
// bater com dedupKey() em lib/finance.js (usada no dedup do lado do cliente)
// para que os dois níveis concordem sobre o que é duplicata.
function dedupKey(t) {
  return [t.account_type || 'credit_card', t.period ?? '', t.bank ?? '', t.date ?? '', t.description, Number(t.value)].join('|');
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const body = await request.json();
  const items = Array.isArray(body) ? body : Array.isArray(body?.transactions) ? body.transactions : [body];

  if (!items.length) {
    return NextResponse.json({ error: 'Nenhum lançamento informado.' }, { status: 400 });
  }
  for (const t of items) {
    if (!t.description || t.value === undefined || !t.category) {
      return NextResponse.json(
        { error: 'Cada lançamento precisa de description, value e category.' },
        { status: 400 },
      );
    }
  }

  // Barreira de duplicidade do lado do servidor: o cliente já filtra antes de
  // enviar, mas isso não protege contra reenvios, abas simultâneas ou chamadas
  // diretas à API — o servidor é a fonte da verdade final.
  const existing = await sql`
    SELECT account_type, period, bank, date, description, value
    FROM transactions
    WHERE user_id = ${userId}
  `;
  const existingCounts = {};
  existing.forEach((r) => {
    const k = dedupKey(r);
    existingCounts[k] = (existingCounts[k] || 0) + 1;
  });

  const seenInBatch = {};
  const toInsert = [];
  let skipped = 0;
  items.forEach((t) => {
    const k = dedupKey(t);
    const occurrence = seenInBatch[k] || 0;
    seenInBatch[k] = occurrence + 1;
    if (occurrence < (existingCounts[k] || 0)) {
      skipped++;
    } else {
      toInsert.push(t);
    }
  });

  const inserted = await Promise.all(
    toInsert.map(
      (t) => sql`
        INSERT INTO transactions (user_id, date, description, bank, period, value, category, account_type)
        VALUES (${userId}, ${t.date || null}, ${t.description}, ${t.bank || null}, ${t.period || null}, ${t.value}, ${t.category}, ${t.account_type || 'credit_card'})
        RETURNING id, user_id, date, description, bank, period, value, category, created_at, account_type
      `,
    ),
  );

  return NextResponse.json(
    { transactions: inserted.map((rows) => rows[0]), inserted: inserted.length, skipped },
    { status: 201 },
  );
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const period = searchParams.get('period');
  const bank = searchParams.get('bank');
  const category = searchParams.get('category');
  const accountType = searchParams.get('accountType');

  const deleted = await sql`
    DELETE FROM transactions
    WHERE user_id = ${userId}
      AND (${period}::text IS NULL OR period = ${period})
      AND (${bank}::text IS NULL OR bank = ${bank})
      AND (${category}::text IS NULL OR category = ${category})
      AND (${accountType}::text IS NULL OR account_type = ${accountType})
    RETURNING id
  `;
  return NextResponse.json({ deleted: deleted.length });
}
