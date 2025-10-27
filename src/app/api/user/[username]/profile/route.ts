import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Check if username is a Steam ID (numeric string starting with 7656)
    const isSteamId = /^7656119\d{10}$/.test(username);
    
    let userData: any = null;
    let userError: any = null;

    if (isSteamId) {
      // Look up by Steam ID
      const { data, error } = await supabase
        .from('users')
        .select('id, username, displayname, avatar_url, role, level, xp, created_at, provider, steam_verified, equipped_banner, steam_id')
        .eq('steam_id', username)
        .eq('is_deleted', false)
        .maybeSingle();
      
      userData = data;
      userError = error;
    } else {
      // Look up by username or displayname
      const { data, error } = await supabase
        .from('users')
        .select('id, username, displayname, avatar_url, role, level, xp, created_at, provider, steam_verified, equipped_banner, steam_id')
        .or(`username.eq.${username},displayname.eq.${username}`)
        .eq('is_deleted', false)
        .maybeSingle();
      
      userData = data;
      userError = error;
    }

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch user's inventory count (sum of quantities)
    const { data: inventoryItems } = await supabase
      .from('user_inventory')
      .select('quantity')
      .eq('user_id', userData.id);
    
    const itemCount = inventoryItems?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

    // Fetch user's badges
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('badge_id, earned_at, badges(name, description, icon_url, rarity)')
      .eq('user_id', userData.id);

    // Fetch user's achievements
    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', userData.id);

    // Fetch betting stats
    const { data: bettingStats } = await supabase
      .from('user_bets')
      .select('status')
      .eq('user_id', userData.id);

    const betsWon = bettingStats?.filter(b => b.status === 'won').length || 0;
    const betsLost = bettingStats?.filter(b => b.status === 'lost').length || 0;
    const totalBets = betsWon + betsLost;
    const winRate = totalBets > 0 ? Math.round((betsWon / totalBets) * 100) : 0;

    // Calculate user's rank
    const { data: rankData } = await supabase
      .from('ranks')
      .select('*')
      .lte('min_level', userData.level || 1)
      .order('min_level', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        username: userData.username || userData.displayname,
        displayname: userData.displayname,
        avatar_url: userData.avatar_url,
        role: userData.role,
        level: userData.level || 1,
        xp: userData.xp || 0,
        rank: rankData?.name || 'Unranked',
        rankIcon: rankData?.icon_url,
        created_at: userData.created_at,
        provider: userData.provider,
        steam_verified: userData.steam_verified,
        equipped_banner: userData.equipped_banner || 'banner_default'
      },
      stats: {
        itemCount: itemCount || 0,
        betsWon,
        totalBets,
        winRate,
        achievementsUnlocked: userAchievements?.length || 0,
        badgesEarned: userBadges?.length || 0
      },
      badges: userBadges || [],
      isPublic: true
    });

  } catch (error) {
    console.error('Public profile API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

