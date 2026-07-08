import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const rows = await sql`
    SELECT user_id, keyword, category
    FROM category_overrides
    WHERE user_id = ${userId}
    ORDER BY keyword
  `;
  return NextResponse.json(rows);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const body = await request.json();
  const { keyword, category } = body;

  if (!keyword || !category) {
    return NextResponse.json({ error: 'keyword e category são obrigatórios.' }, { status: 400 });
  }

  const [row] = await sql`
    INSERT INTO category_overrides (user_id, keyword, category)
    VALUES (${userId}, ${keyword}, ${category})
    ON CONFLICT (user_id, keyword) DO UPDATE SET category = EXCLUDED.category
    RETURNING user_id, keyword, category
  `;
  return NextResponse.json(row);
}
