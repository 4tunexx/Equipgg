import { NextRequest, NextResponse } from 'next/server';
import { getDb, getOne, run } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { serialize } from 'cookie';
import { trackLogin } from '@/lib/mission-tracker';

interface User {
  id: string;
  email: string;
  password_hash: string;
  displayName: string;
  avatar_url: string | null;
  role: string;
  xp: number;
  level: number;
  balance: number;
  created_at: string;
}

const COOKIE_NAME = 'equipgg_session';

export async function POST(req: NextRequest) {
  await getDb();
  const body = await req.json();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  const user = await getOne<User>('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  const token = uuidv4();
  const loginTime = new Date().toISOString();
  
  console.log('Creating session for user:', user.email, 'token:', token.substring(0, 8) + '...');
  
  try {
    const db = await getDb();
    
    // Clean up old sessions (older than 24 hours) to prevent conflicts
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await run('DELETE FROM sessions WHERE user_id = ? AND created_at < ?', [user.id, oneDayAgo]);
    console.log('Cleaned up old sessions for user:', user.email);
    
    // Create new session
    await run('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)', [token, user.id, loginTime]);
    console.log('Session inserted into database');
    
    // Immediately persist the database changes
    await db.export();
    console.log('Database changes persisted');
    
    // Verify session was created with a small delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const createdSession = await getOne('SELECT * FROM sessions WHERE token = ?', [token]);
    console.log('Session verification result:', !!createdSession);
    
    if (!createdSession) {
      console.error('CRITICAL: Session was not created properly!');
      
      // Try to create session again with fresh database connection
      console.log('Attempting to recreate session...');
      await run('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)', [token, user.id, loginTime]);
      await db.export();
      
      // Verify again
      await new Promise(resolve => setTimeout(resolve, 200));
      const retrySession = await getOne('SELECT * FROM sessions WHERE token = ?', [token]);
      if (!retrySession) {
        console.error('CRITICAL: Session creation failed even on retry!');
        throw new Error('Session creation failed after retry');
      } else {
        console.log('Session created successfully on retry');
      }
    } else {
      console.log('Session created and verified successfully');
    }
  } catch (error) {
    console.error('Error creating session:', error);
    throw new Error('Failed to create session');
  }
  
  // Update last login time
  await run('UPDATE users SET lastLoginAt = ? WHERE id = ?', [loginTime, user.id]);
  
  // Track mission progress
  await trackLogin(user.id);
  
  // Persist database changes
  const db = await getDb();
  await db.export();
  
  const res = NextResponse.json({ 
    ok: true, 
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatar_url,
      role: user.role,
      xp: user.xp,
      level: user.level
    }
  });
  const cookieValue = serialize(COOKIE_NAME, token, { 
    httpOnly: true, 
    path: '/', 
    sameSite: 'lax',
    secure: false, // Set to false for localhost development
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });
  
  res.headers.append('Set-Cookie', cookieValue);
  
  // Add a small delay to ensure the session is properly established
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return res;
}


