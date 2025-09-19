import { NextRequest, NextResponse } from 'next/server';
import { supabase } from "../../../../lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const displayName = String(body.displayName || '');

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Use Supabase Auth for sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { displayName }
      }
    });
    if (error) {
      if (error.message && error.message.toLowerCase().includes('already registered')) {
        return NextResponse.json({ error: 'User already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, user: data.user });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


