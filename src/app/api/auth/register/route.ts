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
      console.error('Supabase signup error:', error);
      if (error.message && error.message.toLowerCase().includes('already registered')) {
        return NextResponse.json({ error: 'User already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ error: 'Registration failed - no user created' }, { status: 400 });
    }

    // Create user profile in the users table with 50 coins for new users
    try {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          display_name: displayName || email.split('@')[0],
          provider: 'default',
          level: 1,
          xp: 0,
          coins: 50, // Grant 50 coins to new users
          role: 'user',
          account_status: 'active',
          email_verified: false,
          steam_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't fail registration if profile creation fails
      }
    } catch (profileErr) {
      console.error('Profile creation exception:', profileErr);
    }

    // If user is confirmed immediately (no email verification), sign them in
    if (data.session) {
      console.log('Registration successful with immediate session');
      
      // Set the session cookie
      const response = NextResponse.json({ 
        ok: true, 
        user: {
          id: data.user.id,
          email: data.user.email,
          displayName: displayName || email.split('@')[0],
          provider: 'default',
          level: 1,
          xp: 0,
          role: 'user',
          account_status: 'active'
        },
        session: data.session 
      });
      
      response.cookies.set('sb-equipgg-auth-token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
      
      return response;
    } else {
      // Email verification required
      return NextResponse.json({ 
        ok: true, 
        message: 'Registration successful! Please check your email to verify your account.',
        user: data.user,
        emailVerificationRequired: true
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


