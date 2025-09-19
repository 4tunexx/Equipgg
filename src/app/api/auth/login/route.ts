import { NextRequest, NextResponse } from 'next/server';
import { supabase } from "../../../../lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Use Supabase Auth - faster with timeout
    const { data, error } = await Promise.race([
      supabase.auth.signInWithPassword({ email, password }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Login timeout')), 10000))
    ]) as any;

    if (error || !data.session) {
      return NextResponse.json({ error: error?.message || 'Invalid credentials' }, { status: 401 });
    }

    // Create response
    const response = NextResponse.json({ 
      ok: true, 
      session: data.session, 
      user: data.user 
    });
    
    // Set session cookie
    response.cookies.set('equipgg_session', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}
