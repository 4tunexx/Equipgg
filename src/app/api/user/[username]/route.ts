import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../../lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Get user data by username (display_name) or email
    let { data: user, error } = await supabase
      .from('users')
      .select('id, displayname, avatar_url, xp, level, role, coins, created_at')
      .eq('displayname', username)
      .single();
    
    if (error && !user) {
      // Try by email
      const { data: userByEmail, error: emailError } = await supabase
        .from('users')
        .select('id, displayname, avatar_url, xp, level, role, coins, created_at')
        .eq('email', username)
        .single();
      
      if (!emailError && userByEmail) {
        user = userByEmail;
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return public user data (no sensitive information)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.displayname,
        displayName: user.displayname,
        username: user.displayname,
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