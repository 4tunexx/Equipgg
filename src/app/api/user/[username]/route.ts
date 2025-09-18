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

    // Get user data by username or email from Supabase
    let { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, role, xp, level, avatar_url, created_at')
      .eq('username', username)
      .single();

    if (error || !user) {
      // Try finding by email as fallback
      const { data: userByEmail, error: emailError } = await supabase
        .from('users')
        .select('id, username, email, role, xp, level, avatar_url, created_at')
        .eq('email', username)
        .single();

      if (emailError || !userByEmail) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      user = userByEmail;
    }

    // Return public user data (no sensitive information)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.username,
        displayName: user.username,
        username: user.username,
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