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

    // Return session and user info
    return NextResponse.json({ ok: true, session: data.session, user: data.user });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
