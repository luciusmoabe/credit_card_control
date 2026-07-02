import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id') || 'default';

  const rows = await sql`
    SELECT user_id, keyword, category
    FROM category_overrides
    WHERE user_id = ${userId}
    ORDER BY keyword
  `;
  return NextResponse.json(rows);
}

export async function POST(request) {
  const body = await request.json();
  const { keyword, category, user_id: userId = 'default' } = body;

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
