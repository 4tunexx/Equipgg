import { NextRequest, NextResponse } from 'next/server';
import { getDb, run } from '@/lib/db';
import { parse } from 'cookie';

const COOKIE_NAME = 'equipgg_session';

export async function POST(req: NextRequest) {
  try {
    await getDb(); // Ensure database is loaded
    
    const cookie = req.headers.get('cookie') || '';
    const parsed = parse(cookie);
    const token = parsed[COOKIE_NAME];
    
    if (token) {
      run('DELETE FROM sessions WHERE token = ?', [token]);
    }
    
    const res = NextResponse.json({ ok: true });
    res.headers.append('Set-Cookie', `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
    return res;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}


