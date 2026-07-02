import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id') || 'default';

  const rows = await sql`
    SELECT user_id, category, monthly_amount
    FROM category_budgets
    WHERE user_id = ${userId}
    ORDER BY category
  `;
  return NextResponse.json(rows);
}

export async function POST(request) {
  const body = await request.json();
  const userId = body.user_id || 'default';
  const category = body.category;
  const monthlyAmount = body.monthly_amount;

  if (!category || monthlyAmount === undefined || monthlyAmount === null) {
    return NextResponse.json({ error: 'category e monthly_amount são obrigatórios.' }, { status: 400 });
  }

  const [row] = await sql`
    INSERT INTO category_budgets (user_id, category, monthly_amount)
    VALUES (${userId}, ${category}, ${monthlyAmount})
    ON CONFLICT (user_id, category) DO UPDATE SET monthly_amount = EXCLUDED.monthly_amount
    RETURNING user_id, category, monthly_amount
  `;
  return NextResponse.json(row);
}

export async function DELETE(request) {
  const body = await request.json();
  const userId = body.user_id || 'default';
  const category = body.category;

  if (!category) {
    return NextResponse.json({ error: 'category é obrigatório.' }, { status: 400 });
  }

  await sql`DELETE FROM category_budgets WHERE user_id = ${userId} AND category = ${category}`;
  return NextResponse.json({ deleted: category });
}
