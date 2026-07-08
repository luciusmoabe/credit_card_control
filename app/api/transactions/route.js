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

  const inserted = await Promise.all(
    items.map(
      (t) => sql`
        INSERT INTO transactions (user_id, date, description, bank, period, value, category, account_type)
        VALUES (${userId}, ${t.date || null}, ${t.description}, ${t.bank || null}, ${t.period || null}, ${t.value}, ${t.category}, ${t.account_type || 'credit_card'})
        RETURNING id, user_id, date, description, bank, period, value, category, created_at, account_type
      `,
    ),
  );

  return NextResponse.json(
    inserted.map((rows) => rows[0]),
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

  const deleted = await sql`
    DELETE FROM transactions 
    WHERE user_id = ${userId}
      AND (${period}::text IS NULL OR period = ${period})
      AND (${bank}::text IS NULL OR bank = ${bank})
      AND (${category}::text IS NULL OR category = ${category})
    RETURNING id
  `;
  return NextResponse.json({ deleted: deleted.length });
}
