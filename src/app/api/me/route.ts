import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from "../../../lib/auth-utils";
import { createServerSupabaseClient } from "../../../lib/supabase";

interface User {
  id: string;
  email: string;
  username?: string;
  displayname?: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  role: string;
  coins: number;
  gems?: number;
  steam_id?: string;
  steam_verified?: boolean;
}

export async function GET(req: NextRequest) {
  try {
    console.log('=== /api/me DEBUG ===');
    console.log('Request headers:', req.headers);
    console.log('Request cookies:', req.cookies.getAll());
    
    // Try to get the cookie directly
    const equipggCookie = req.cookies.get('equipgg_session');
    console.log('Direct equipgg_session cookie:', equipggCookie);
    console.log('Direct equipgg_session cookie value:', equipggCookie?.value);
    
    const session = await getAuthSession(req);
    
    console.log('Session result:', session);
    console.log('Session result type:', typeof session);
    console.log('Session result null check:', session === null);
    console.log('Session result truthy check:', !!session);
    
    if (!session) {
      console.log('No session found, returning null user');
      return NextResponse.json({ user: null });
    }
    
    console.log('Session user_id:', session.user_id);
    
    const supabase = createServerSupabaseClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, displayname, avatar_url, xp, level, role, coins, gems, steam_id, steam_verified')
      .eq('id', session.user_id)
      .single();
    
    if (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json({ user: null });
    }
    
    if (user) {
      // For Steam users, use username (Steam nickname) as displayName, fallback to displayname
      const displayName = user.username || user.displayname || 'Player';
      const isSteamUser = !!user.steam_id;
      
      // Build Steam profile data if user is a Steam user
      const steamProfile = isSteamUser ? {
        steamId: user.steam_id,
        avatar: user.avatar_url || '',
        profileUrl: user.steam_id ? `https://steamcommunity.com/profiles/${user.steam_id}` : ''
      } : undefined;
      
      // Map to expected frontend fields
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          displayName: displayName,
          avatarUrl: user.avatar_url,
          xp: user.xp || 0,
          level: user.level || 1,
          role: user.role || 'user',
          coins: user.coins || 0,
          gems: user.gems || 0,
          steamVerified: user.steam_verified || false,
          steamId: user.steam_id,
          isSteamUser: isSteamUser,
          steamProfile: steamProfile,
        }
      });
    }
    return NextResponse.json({ user: null });
  } catch (error) {
    console.error('Error in /api/me:', error);
    return NextResponse.json({ user: null, error: 'Internal error' });
  }
}


