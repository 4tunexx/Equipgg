import { NextRequest, NextResponse } from 'next/server';
import { supabase } from "../../../../lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Get Supabase Auth session from cookie (client should send access_token in header or cookie)
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Get user from Supabase Auth
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Get user data from users table
    const { data, error } = await supabase
      .from('users')
      .select('id, email, display_name, role, coins, gems, xp, level, created_at')
      .eq('id', user.id)
      .single();
    if (error || !data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    // Get user's inventory count
    const { data: inventoryData } = await supabase
      .from('user_inventory')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    const itemCount = inventoryData?.length ?? 0;
    // Placeholders for stats, achievements, referrals
    const betsWon = 0;
    const winRate = 0;
    const achievements: any[] = [];
    const referrals: any[] = [];
    return NextResponse.json({
      success: true,
      profile: {
        user: {
          id: data.id,
          email: data.email,
          displayName: data.display_name,
          role: data.role,
          coins: data.coins || 0,
          gems: data.gems || 0,
          xp: data.xp || 0,
          level: data.level || 1,
          createdAt: data.created_at
        },
        stats: {
          itemCount,
          betsWon,
          winRate,
          achievements: achievements.length,
          referrals: referrals.length
        },
        achievements,
        referrals
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
