import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const users = await sql`SELECT id, name, email, role, active FROM users ORDER BY name ASC`;
  return NextResponse.json(users);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, email, password, role } = await request.json();
  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);
  const id = 'usr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const userRole = role === 'admin' ? 'admin' : 'user';

  try {
    await sql`
      INSERT INTO users (id, name, email, password_hash, role)
      VALUES (${id}, ${name}, ${email}, ${hash}, ${userRole})
    `;
    return NextResponse.json({ id, name, email, role: userRole });
  } catch (err) {
    if (err.message.includes('duplicate key')) {
      return NextResponse.json({ error: 'E-mail já cadastrado.' }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
