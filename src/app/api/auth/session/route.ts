import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../lib/supabase';

export async function GET(req: NextRequest) {
  try {
    console.log('Session verification API called');
    
    const supabase = createServerSupabaseClient();
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json(
        { error: 'Session error', details: sessionError.message },
        { status: 401 }
      );
    }

    if (!session) {
      console.log('No active session found');
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json(
        { error: 'Profile fetch error', details: profileError.message },
        { status: 500 }
      );
    }

    const userData = {
      id: session.user.id,
      email: session.user.email,
      role: session.user.user_metadata?.role || userProfile?.role || 'user',
      steam_verified: userProfile?.steam_verified || false,
      account_status: userProfile?.account_status || 'active',
      ...userProfile
    };

    console.log('Session verification successful for user:', userData.email);

    return NextResponse.json({
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        user: userData
      },
      user: userData
    });

  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}