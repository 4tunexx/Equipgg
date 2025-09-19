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

    // Use Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create response with session cookie
    const response = NextResponse.json({ ok: true, session: data.session, user: data.user });
    
    // Set the session cookie that middleware expects
    response.cookies.set('equipgg_session', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
