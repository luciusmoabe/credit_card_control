import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/auth";
import bcrypt from 'bcryptjs';

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { name, email, role, password, active } = await request.json();

  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

  try {
    if (name) await sql`UPDATE users SET name = ${name} WHERE id = ${id}`;
    if (email) await sql`UPDATE users SET email = ${email} WHERE id = ${id}`;
    if (role) await sql`UPDATE users SET role = ${role} WHERE id = ${id}`;
    if (active !== undefined) await sql`UPDATE users SET active = ${active} WHERE id = ${id}`;
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${id}`;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err.message.includes('duplicate key')) {
      return NextResponse.json({ error: 'E-mail já cadastrado.' }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  
  if (id === session.user.id) {
    return NextResponse.json({ error: 'Você não pode excluir a si mesmo.' }, { status: 400 });
  }

  try {
    await sql`DELETE FROM users WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
