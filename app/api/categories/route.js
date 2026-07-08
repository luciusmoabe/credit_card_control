import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { DEFAULT_CATEGORIES } from '@/lib/finance';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  let rows = await sql`
    SELECT name, color, default_key, is_system, sort_order
    FROM categories
    WHERE user_id = ${userId}
    ORDER BY sort_order, name
  `;

  if (rows.length === 0) {
    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      const c = DEFAULT_CATEGORIES[i];
      const isSystem = c.name === 'Pagamento Fatura' || c.name === 'Outros';
      await sql`
        INSERT INTO categories (user_id, name, color, default_key, is_system, sort_order)
        VALUES (${userId}, ${c.name}, ${c.color}, ${c.default_key || null}, ${isSystem}, ${i + 1})
      `;
    }
    rows = await sql`
      SELECT name, color, default_key, is_system, sort_order
      FROM categories
      WHERE user_id = ${userId}
      ORDER BY sort_order, name
    `;
  }

  return NextResponse.json(rows);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const body = await request.json();
  const name = (body.name || '').trim();
  const color = body.color || '#B4B2A9';

  if (!name) {
    return NextResponse.json({ error: 'name é obrigatório.' }, { status: 400 });
  }

  const [existing] = await sql`SELECT name FROM categories WHERE user_id = ${userId} AND name = ${name}`;
  if (existing) {
    return NextResponse.json({ error: 'Já existe uma categoria com esse nome.' }, { status: 409 });
  }

  const [{ next_order }] = await sql`
    SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM categories WHERE user_id = ${userId}
  `;

  const [row] = await sql`
    INSERT INTO categories (user_id, name, color, default_key, is_system, sort_order)
    VALUES (${userId}, ${name}, ${color}, NULL, false, ${next_order})
    RETURNING name, color, default_key, is_system, sort_order
  `;
  return NextResponse.json(row, { status: 201 });
}

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const body = await request.json();
  const name = body.name;
  const newName = body.newName ? body.newName.trim() : undefined;
  const color = body.color;

  if (!name) {
    return NextResponse.json({ error: 'name é obrigatório.' }, { status: 400 });
  }

  const [category] = await sql`SELECT * FROM categories WHERE user_id = ${userId} AND name = ${name}`;
  if (!category) {
    return NextResponse.json({ error: 'Categoria não encontrada.' }, { status: 404 });
  }

  if (newName && newName !== name) {
    if (category.is_system) {
      return NextResponse.json({ error: 'Essa categoria não pode ser renomeada.' }, { status: 400 });
    }
    const [conflict] = await sql`SELECT name FROM categories WHERE user_id = ${userId} AND name = ${newName}`;
    if (conflict) {
      return NextResponse.json({ error: 'Já existe uma categoria com esse nome.' }, { status: 409 });
    }
    await sql`UPDATE transactions SET category = ${newName} WHERE user_id = ${userId} AND category = ${name}`;
    await sql`UPDATE category_overrides SET category = ${newName} WHERE user_id = ${userId} AND category = ${name}`;
    await sql`UPDATE category_budgets SET category = ${newName} WHERE user_id = ${userId} AND category = ${name}`;
  }

  const [row] = await sql`
    UPDATE categories
    SET name = COALESCE(${newName ?? null}, name),
        color = COALESCE(${color ?? null}, color)
    WHERE user_id = ${userId} AND name = ${name}
    RETURNING name, color, default_key, is_system, sort_order
  `;
  return NextResponse.json(row);
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const body = await request.json();
  const name = body.name;

  if (!name) {
    return NextResponse.json({ error: 'name é obrigatório.' }, { status: 400 });
  }

  const [category] = await sql`SELECT * FROM categories WHERE user_id = ${userId} AND name = ${name}`;
  if (!category) {
    return NextResponse.json({ error: 'Categoria não encontrada.' }, { status: 404 });
  }
  if (category.is_system) {
    return NextResponse.json({ error: 'Essa categoria não pode ser excluída.' }, { status: 400 });
  }

  await sql`UPDATE transactions SET category = 'Outros' WHERE user_id = ${userId} AND category = ${name}`;
  await sql`UPDATE category_overrides SET category = 'Outros' WHERE user_id = ${userId} AND category = ${name}`;
  await sql`DELETE FROM category_budgets WHERE user_id = ${userId} AND category = ${name}`;
  await sql`DELETE FROM categories WHERE user_id = ${userId} AND name = ${name}`;

  return NextResponse.json({ deleted: name });
}
