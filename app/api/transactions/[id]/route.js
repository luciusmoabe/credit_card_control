import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();

  if (
    body.date === undefined &&
    body.description === undefined &&
    body.bank === undefined &&
    body.value === undefined &&
    body.category === undefined
  ) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar.' }, { status: 400 });
  }

  const [row] = await sql`
    UPDATE transactions
    SET
      date = COALESCE(${body.date ?? null}, date),
      description = COALESCE(${body.description ?? null}, description),
      bank = COALESCE(${body.bank ?? null}, bank),
      value = COALESCE(${body.value ?? null}, value),
      category = COALESCE(${body.category ?? null}, category)
    WHERE id = ${id}::int
    RETURNING id, user_id, date, description, bank, period, value, category, created_at
  `;

  if (!row) {
    return NextResponse.json({ error: 'Lançamento não encontrado.' }, { status: 404 });
  }

  return NextResponse.json(row);
}

export async function DELETE(request, { params }) {
  const { id } = await params;

  const [row] = await sql`DELETE FROM transactions WHERE id = ${id}::int RETURNING id`;

  if (!row) {
    return NextResponse.json({ error: 'Lançamento não encontrado.' }, { status: 404 });
  }

  return NextResponse.json({ deleted: row.id });
}
