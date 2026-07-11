import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const rows = await sql`
    SELECT user_id, period, gross_income, deductions, net_income, created_at
    FROM income
    WHERE user_id = ${userId}
    ORDER BY period DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const body = await request.json();
  const { period, gross_income, deductions, net_income } = body;

  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    return NextResponse.json({ error: 'period é obrigatório no formato AAAA-MM.' }, { status: 400 });
  }
  if (net_income === undefined || net_income === null || !Number.isFinite(Number(net_income)) || Number(net_income) <= 0) {
    return NextResponse.json({ error: 'net_income é obrigatório e deve ser um número maior que zero.' }, { status: 400 });
  }

  const [row] = await sql`
    INSERT INTO income (user_id, period, gross_income, deductions, net_income)
    VALUES (${userId}, ${period}, ${gross_income ?? null}, ${deductions ?? null}, ${net_income})
    ON CONFLICT (user_id, period) DO UPDATE
      SET gross_income = EXCLUDED.gross_income,
          deductions = EXCLUDED.deductions,
          net_income = EXCLUDED.net_income
    RETURNING user_id, period, gross_income, deductions, net_income, created_at
  `;
  return NextResponse.json(row);
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const body = await request.json();
  const { period } = body;

  if (!period) {
    return NextResponse.json({ error: 'period é obrigatório.' }, { status: 400 });
  }

  await sql`DELETE FROM income WHERE user_id = ${userId} AND period = ${period}`;
  return NextResponse.json({ deleted: period });
}
