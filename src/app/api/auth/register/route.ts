import { NextRequest, NextResponse } from 'next/server';
import { getDb, run, getOne } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  await getDb();
  const body = await req.json();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const displayName = String(body.displayName || '');

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }
  const existing = await getOne<{ id: string }>('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) return NextResponse.json({ error: 'User already exists' }, { status: 409 });

  const id = uuidv4();
  const hash = bcrypt.hashSync(password, 10);
  const timestamp = new Date().toISOString();
  await run(
    'INSERT INTO users (id, email, password_hash, display_name, displayName, xp, level, created_at, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, email, hash, displayName || null, displayName || null, 0, 1, timestamp, timestamp]
  );

  return NextResponse.json({ ok: true });
}


