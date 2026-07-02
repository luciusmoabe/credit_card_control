import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id') || 'default';
  const period = searchParams.get('period');
  const category = searchParams.get('category');
  const bank = searchParams.get('bank');

  const rows = await sql`
    SELECT id, user_id, date, description, bank, period, value, category, created_at
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
        INSERT INTO transactions (user_id, date, description, bank, period, value, category)
        VALUES (${t.user_id || 'default'}, ${t.date || null}, ${t.description}, ${t.bank || null}, ${t.period || null}, ${t.value}, ${t.category})
        RETURNING id, user_id, date, description, bank, period, value, category, created_at
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
  const userId = searchParams.get('user_id') || 'default';

  const deleted = await sql`DELETE FROM transactions WHERE user_id = ${userId} RETURNING id`;
  return NextResponse.json({ deleted: deleted.length });
}
