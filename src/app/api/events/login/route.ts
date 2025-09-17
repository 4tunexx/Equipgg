import { NextRequest, NextResponse } from 'next/server';
import { getDb, getOne, run } from '@/lib/db';
import { parse } from 'cookie';

interface Session {
  token: string;
  user_id: string;
  created_at: string;
}

interface MissionProgress {
  user_id: string;
  mission_id: string;
  progress: number;
}

const COOKIE_NAME = 'equipgg_session';

export async function POST(req: NextRequest) {
  await getDb();
  const cookie = req.headers.get('cookie') || '';
  const parsed = parse(cookie);
  const token = parsed[COOKIE_NAME];
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const session = await getOne<Session>('SELECT * FROM sessions WHERE token = ?', [token]);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Check if user has already received login reward today
  const today = new Date().toISOString().split('T')[0];
  const lastLogin = await getOne<{last_login_date: string}>('SELECT DATE(lastLoginAt) as last_login_date FROM users WHERE id = ?', [session.user_id]);
  
  const isFirstLoginToday = !lastLogin?.last_login_date || lastLogin.last_login_date !== today;

  if (isFirstLoginToday) {
    // Award login reward through reward system
    const rewardResponse = await fetch(`http://localhost:9003/api/xp/award`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        activity_type: 'login',
        reason: 'Daily login bonus'
      })
    });

    let rewardData = null;
    if (rewardResponse.ok) {
      rewardData = await rewardResponse.json();
    }

    return NextResponse.json({ 
      ok: true, 
      firstLoginToday: true,
      reward: rewardData
    });
  }

  return NextResponse.json({ 
    ok: true, 
    firstLoginToday: false 
  });
}


