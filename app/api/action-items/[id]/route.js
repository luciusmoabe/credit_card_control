import { NextResponse } from 'next/server';
import { sqlAsUser } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const sql = sqlAsUser(userId);
  const { id } = await params;
  const body = await request.json();

  if (
    body.title === undefined &&
    body.category === undefined &&
    body.target_amount === undefined &&
    body.due_date === undefined &&
    body.status === undefined
  ) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar.' }, { status: 400 });
  }

  const status = body.status ?? null;

  const [row] = await sql`
    UPDATE action_items
    SET
      title = COALESCE(${body.title ?? null}, title),
      category = COALESCE(${body.category ?? null}, category),
      target_amount = COALESCE(${body.target_amount ?? null}, target_amount),
      due_date = COALESCE(${body.due_date ?? null}, due_date),
      status = COALESCE(${status}::text, status),
      completed_at = CASE
        WHEN ${status}::text = 'done' THEN now()
        WHEN ${status}::text IS NOT NULL AND ${status}::text != 'done' THEN NULL
        ELSE completed_at
      END
    WHERE id = ${id}::int AND user_id = ${userId}
    RETURNING id, user_id, title, category, target_amount, due_date, status, created_at, completed_at
  `;

  if (!row) {
    return NextResponse.json({ error: 'Item não encontrado.' }, { status: 404 });
  }

  return NextResponse.json(row);
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const sql = sqlAsUser(userId);
  const { id } = await params;

  const [row] = await sql`DELETE FROM action_items WHERE id = ${id}::int AND user_id = ${userId} RETURNING id`;

  if (!row) {
    return NextResponse.json({ error: 'Item não encontrado.' }, { status: 404 });
  }

  return NextResponse.json({ deleted: row.id });
}
