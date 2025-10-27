import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from "../../../lib/auth-utils";
import { createServerSupabaseClient } from "../../../lib/supabase";
import { getLevelFromXP } from "../../../lib/xp-config";

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
      .select('id, email, username, displayname, avatar_url, xp, level, role, coins, gems, steam_id, steam_verified, equipped_banner')
      .eq('id', session.user_id)
      .single();
    
    if (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json({ user: null });
    }
    
    if (user) {
      // For Steam users, use displayname (Steam nickname) as displayName, fallback to username
      const displayName = user.displayname || user.username || 'Player';
      const isSteamUser = !!user.steam_id;
      
      // Calculate level from XP to ensure consistency
      const calculatedLevel = getLevelFromXP(user.xp || 0);
      
      // Get user's current rank based on level
      const { data: rank } = await supabase
        .from('ranks')
        .select('*')
        .gte('min_level', calculatedLevel)
        .lte('max_level', calculatedLevel)
        .eq('is_active', true)
        .single();
      
      // Build Steam profile data if user is a Steam user
      const steamProfile = isSteamUser ? {
        steamId: user.steam_id,
        avatar: user.avatar_url || '',
        profileUrl: user.steam_id ? `https://steamcommunity.com/profiles/${user.steam_id}` : ''
      } : undefined;
      
      // Map to expected frontend fields with proper Steam profile data
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          displayName: displayName,
          username: user.username,
          photoURL: user.avatar_url,
          avatarUrl: user.avatar_url, // Keep both for compatibility
          avatar_url: user.avatar_url, // Add for banner display
          xp: user.xp || 0,
          level: calculatedLevel, // Use calculated level from XP
          role: user.role || 'user',
          coins: user.coins || 0,
          gems: user.gems || 0,
          steamVerified: user.steam_verified || false,
          steamId: user.steam_id,
          isSteamUser: isSteamUser,
          steamProfile: steamProfile,
          provider: isSteamUser ? 'steam' : 'default',
          equipped_banner: user.equipped_banner || 'banner_default',
          rank: rank ? {
            id: rank.id,
            name: rank.name,
            tier: rank.tier,
            icon_url: rank.icon_url,
            prestige_icon_url: rank.prestige_icon_url
          } : null
        }
      });
    }
    return NextResponse.json({ user: null });
  } catch (error) {
    console.error('Error in /api/me:', error);
    return NextResponse.json({ user: null, error: 'Internal error' });
  }
}


