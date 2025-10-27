import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../../lib/supabase";
import { getLevelFromXP } from "../../../../lib/xp-config";

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

    // Check if username is a Steam ID (numeric string starting with 7656)
    const isSteamId = /^7656119\d{10}$/.test(username);
    
    let user: any = null;
    let error: any = null;

    if (isSteamId) {
      // Look up by Steam ID
      const { data, error: steamError } = await supabase
        .from('users')
        .select('id, username, displayname, avatar_url, xp, level, role, coins, created_at')
        .eq('steam_id', username)
        .single();
      
      user = data;
      error = steamError;
    } else {
      // Get user data by username, displayname, or email
      let { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username, displayname, avatar_url, xp, level, role, coins, created_at')
        .eq('username', username)
        .single();
      
      if (userError && !userData) {
        // Try by displayname
        const { data: userByDisplayName, error: displayError } = await supabase
          .from('users')
          .select('id, username, displayname, avatar_url, xp, level, role, coins, created_at')
          .eq('displayname', username)
          .single();
        
        if (!displayError && userByDisplayName) {
          userData = userByDisplayName;
        } else {
          // Try by email
          const { data: userByEmail, error: emailError } = await supabase
            .from('users')
            .select('id, username, displayname, avatar_url, xp, level, role, coins, created_at')
            .eq('email', username)
            .single();
          
          if (!emailError && userByEmail) {
            userData = userByEmail;
          }
        }
      }
      
      user = userData;
      error = userError;
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate level from XP to ensure consistency
    const calculatedLevel = getLevelFromXP(user.xp || 0);

    // Return public user data (no sensitive information)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.displayname || user.username || 'Player',
        displayName: user.displayname || user.username || 'Player',
        username: user.username || user.displayname || 'Player',
        role: user.role || 'user',
        xp: user.xp || 0,
        level: calculatedLevel, // Use calculated level from XP
        avatar: user.avatar_url || null,
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