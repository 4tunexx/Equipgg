import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
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

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password
    const valid = bcrypt.compareSync(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = uuidv4();
    const loginTime = new Date();
    
    console.log('Creating session for user:', user.email, 'token:', token.substring(0, 8) + '...');
    
    // Clean up old sessions (older than 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.session.deleteMany({
      where: {
        userId: user.id,
        createdAt: {
          lt: oneDayAgo
        }
      }
    });
    
    // Create new session
    await prisma.session.create({
      data: {
        token,
        userId: user.id,
        createdAt: loginTime
      }
    });
    
    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: loginTime }
    });
    
    // Track mission progress
    await trackLogin(user.id);
    
    const res = NextResponse.json({ 
      ok: true, 
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
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
    await prisma.$disconnect();
  }
}


