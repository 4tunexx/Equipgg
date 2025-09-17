import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getDb, getOne, run } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { serialize } from 'cookie';
import { trackLogin } from '@/lib/mission-tracker';

const COOKIE_NAME = 'equipgg_session';
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    let user: any = null;
    let usePrisma = false;

    // Try Prisma first (for production with Supabase)
    try {
      user = await prisma.user.findUnique({
        where: { email }
      });
      usePrisma = true;
      console.log('Using Prisma for database connection');
    } catch (prismaError) {
      console.log('Prisma connection failed, falling back to SQLite:', prismaError);
      // Fallback to SQLite
      await getDb();
      user = await getOne('SELECT * FROM users WHERE email = ?', [email]);
      usePrisma = false;
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password (handle different field names)
    const passwordHash = usePrisma ? user.passwordHash : user.password_hash;
    const valid = bcrypt.compareSync(password, passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = uuidv4();
    const loginTime = new Date();
    
    console.log('Creating session for user:', user.email, 'token:', token.substring(0, 8) + '...');
    
    if (usePrisma) {
      // Use Prisma for session management
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await prisma.session.deleteMany({
        where: {
          userId: user.id,
          createdAt: {
            lt: oneDayAgo
          }
        }
      });
      
      await prisma.session.create({
        data: {
          token,
          userId: user.id,
          createdAt: loginTime
        }
      });
      
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: loginTime }
      });
    } else {
      // Use SQLite for session management
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      await run('DELETE FROM sessions WHERE user_id = ? AND created_at < ?', [user.id, oneDayAgo]);
      await run('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)', [token, user.id, loginTime.toISOString()]);
      await run('UPDATE users SET lastLoginAt = ? WHERE id = ?', [loginTime.toISOString(), user.id]);
      
      // Persist SQLite changes
      const db = await getDb();
      await db.export();
    }
    
    // Track mission progress
    await trackLogin(user.id);
    
    const res = NextResponse.json({ 
      ok: true, 
      user: {
        id: user.id,
        email: user.email,
        displayName: usePrisma ? user.displayName : user.displayName,
        avatarUrl: usePrisma ? user.avatarUrl : user.avatar_url,
        role: user.role,
        xp: user.xp,
        level: user.level
      }
    });
    
    const cookieValue = serialize(COOKIE_NAME, token, { 
      httpOnly: true, 
      path: '/', 
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    
    res.headers.append('Set-Cookie', cookieValue);
    
    return res;
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    try {
      await prisma.$disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
  }
}


