import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    console.log('🔍 Profile API called for username:', username);

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Check if username is a UUID, Steam ID (numeric string starting with 7656) or steam- prefix
    const isUuidCheck = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(username);
    const isSteamIdNumeric = /^7656119\d{10}$/.test(username);
    const isSteamIdFormat = username.startsWith('steam-');
    
    console.log('🔍 Username check:', { username, isUuidCheck, isSteamIdNumeric, isSteamIdFormat });
    
    let userData: any = null;
    let userError: any = null;

    if (isUuidCheck || isSteamIdFormat) {
      // Look up by user ID (UUID or steam- prefix format)
      console.log('🔍 Looking up by user ID:', username);
      const { data, error } = await supabase
        .from('users')
        .select('id, username, displayname, avatar_url, role, level, xp, created_at, provider, steam_verified, equipped_banner, steam_id')
        .eq('id', username)
        .eq('is_deleted', false)
        .maybeSingle();
      
      userData = data;
      userError = error;
      console.log('🔍 User ID lookup result:', { found: !!data, error: error?.message });
    } else if (isSteamIdNumeric) {
      // Look up by Steam ID (numeric format)
      console.log('🔍 Looking up by numeric Steam ID:', username);
      const { data, error } = await supabase
        .from('users')
        .select('id, username, displayname, avatar_url, role, level, xp, created_at, provider, steam_verified, equipped_banner, steam_id')
        .eq('steam_id', username)
        .eq('is_deleted', false)
        .maybeSingle();
      
      userData = data;
      userError = error;
      console.log('🔍 Steam ID lookup result:', { found: !!data, error: error?.message });
    } else {
      // Look up by username or displayname
      console.log('🔍 Looking up by username/displayname:', username);
      const { data, error } = await supabase
        .from('users')
        .select('id, username, displayname, avatar_url, role, level, xp, created_at, provider, steam_verified, equipped_banner, steam_id')
        .or(`username.eq.${username},displayname.eq.${username}`)
        .eq('is_deleted', false)
        .maybeSingle();
      
      userData = data;
      userError = error;
      console.log('🔍 Username lookup result:', { found: !!data, error: error?.message });
    }

    if (userError || !userData) {
      console.error('❌ User not found:', { username, userError });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('✅ User found:', userData.id, userData.username || userData.displayname);

    // Fetch user's inventory count (sum of quantities)
    const { data: inventoryItems } = await supabase
      .from('user_inventory')
      .select('quantity')
      .eq('user_id', userData.id);
    
    const itemCount = inventoryItems?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

    // Fetch user's badges
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('badge_id, earned_at, badges!fk_user_badges_badge_id(name, description, icon_url, rarity)')
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

    // If param is a UUID (Supabase user id), fetch directly by id
    const rawParams = await params;
    const usernameParam = rawParams?.username;
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(String(usernameParam));
    if (isUuid) {
      const supabase = createServerSupabaseClient();
      const { data: uuidUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', usernameParam)
        .maybeSingle();

      if (uuidUser) {
        const { getLevelFromXP } = await import('../../../../../lib/xp-config');
        const computedLevelUuid = getLevelFromXP(uuidUser.xp || 0);
        return NextResponse.json({
          success: true,
          user: {
            id: uuidUser.id,
            username: uuidUser.username || uuidUser.displayname,
            displayname: uuidUser.displayname,
            avatar_url: uuidUser.avatar_url,
            role: uuidUser.role,
            level: computedLevelUuid || uuidUser.level || 1,
            xp: uuidUser.xp || 0,
            provider: uuidUser.provider,
            steam_verified: uuidUser.steam_verified,
            created_at: uuidUser.created_at,
            equipped_banner: uuidUser.equipped_banner || 'banner_default'
          },
          stats: {},
          badges: [],
          isPublic: true
        });
      }
    }

    // Compute level from XP to keep consistency with UI mini-card
    const { getLevelFromXP } = await import('../../../../../lib/xp-config');
    const computedLevel = getLevelFromXP(userData.xp || 0);

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        username: userData.username || userData.displayname,
        displayname: userData.displayname,
        avatar_url: userData.avatar_url,
        role: userData.role,
        level: computedLevel || userData.level || 1,
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

