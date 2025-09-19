import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, password, username } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0]
        }
      }
    });

    if (error) {
      console.error('Supabase signup error:', error);
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { message: 'Signup failed' },
        { status: 400 }
      );
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: data.user.id,
        username: username || email.split('@')[0],
        email: email,
        role: 'user',
        coins: 1000, // Starting coins
        gems: 10,    // Starting gems
        xp: 0,
        level: 1
      }]);

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    return NextResponse.json({
      message: 'Sign up successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        username: username || email.split('@')[0]
      }
    });

  } catch (error) {
    console.error('Sign up API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}