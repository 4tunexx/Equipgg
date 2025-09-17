import { NextRequest, NextResponse } from 'next/server';
import { getOne, getDb } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-utils';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  xp: number;
  level: number;
  role: string;
  coins: number;
  gems: number;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    
    if (!session) {
      return NextResponse.json({ user: null });
    }
    
    await getDb();
    const user = await getOne<User>('SELECT id, email, displayName, avatar_url as avatarUrl, xp, level, role, coins, gems FROM users WHERE id = ?', [session.user_id]);
    
    if (user) {
      return NextResponse.json({ user });
    }
    
    return NextResponse.json({ user: null });
  } catch (error) {
    console.error('Error in /api/me:', error);
    return NextResponse.json({ user: null, error: 'Internal error' });
  }
}


