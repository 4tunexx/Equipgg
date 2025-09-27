import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '../../../../lib/auth-utils';
import { supabase } from "../../../../lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data from users table
    const { data, error } = await supabase
      .from('users')
      .select('id, email, displayname, role, coins, gems, xp, level, created_at')
      .eq('id', session.user_id)
      .single();
    if (error || !data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    // Get user's inventory count
    const { data: inventoryData } = await supabase
      .from('user_inventory')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', session.user_id);
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
          displayName: data.displayname,
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

export async function PUT(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { displayName } = body;

    // Validate input
    if (!displayName || typeof displayName !== 'string') {
      return NextResponse.json(
        { error: 'Invalid display name' },
        { status: 400 }
      );
    }

    // Update user profile
    const { data, error } = await supabase
      .from('users')
      .update({ displayname: displayName })
      .eq('id', session.user_id)
      .select('id, email, displayname, role, coins, gems, xp, level, created_at')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.id,
        email: data.email,
        displayName: data.displayname,
        role: data.role,
        coins: data.coins || 0,
        gems: data.gems || 0,
        xp: data.xp || 0,
        level: data.level || 1,
        createdAt: data.created_at
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
