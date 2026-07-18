import { NextResponse } from 'next/server';
import { sqlAsUser } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const sql = sqlAsUser(userId);

  const rows = await sql`
    SELECT id, user_id, title, category, target_amount, due_date, status, created_at, completed_at
    FROM action_items
    WHERE user_id = ${userId}
    ORDER BY status, due_date NULLS LAST, created_at DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const sql = sqlAsUser(userId);
  const body = await request.json();
  const title = (body.title || '').trim();
  const { category, target_amount, due_date } = body;

  if (!title) {
    return NextResponse.json({ error: 'title é obrigatório.' }, { status: 400 });
  }

  const [row] = await sql`
    INSERT INTO action_items (user_id, title, category, target_amount, due_date)
    VALUES (${userId}, ${title}, ${category || null}, ${target_amount ?? null}, ${due_date || null})
    RETURNING id, user_id, title, category, target_amount, due_date, status, created_at, completed_at
  `;
  return NextResponse.json(row, { status: 201 });
}
