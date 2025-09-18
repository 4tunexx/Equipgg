import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Get user data by username (display_name) from Supabase
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('display_name', username)
      .single();

    if (error && error.code === 'PGRST116') {
      // User not found by display_name, try by email
      const { data: userByEmail, error: emailError } = await supabase
        .from('users')
        .select('*')
        .eq('email', username)
        .single();

      if (emailError) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      user = userByEmail;
    } else if (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return public user data (no sensitive information)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.display_name,
        displayName: user.display_name,
        username: user.display_name,
        role: user.role || 'user',
        xp: user.xp || 0,
        level: user.level || 1,
        avatar: user.avatar_url || `https://picsum.photos/40/40?random=${user.id}`,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
        dataAiHint: 'user avatar'
      }
    });

  } catch (error) {
    console.error('Error fetching user by username:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}