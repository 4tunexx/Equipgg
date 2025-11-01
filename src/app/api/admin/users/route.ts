import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../../lib/supabase";
import { getLevelFromXP } from "../../../../lib/xp-config";

export async function GET(request: NextRequest) {
  try {
    console.log('Admin users API called');
    const supabase = createServerSupabaseClient();

    // Get all users with their stats
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, displayname, role, coins, gems, xp, level, created_at')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get additional stats for each user
    const usersWithStats = await Promise.all(
      (users || []).map(async (user: any) => {
        // Get inventory count - SUM quantities (not just count rows)
        const { data: inventoryData } = await supabase
          .from('user_inventory')
          .select('quantity')
          .eq('user_id', user.id);
        
        // Sum all quantities for stacked items
        const inventoryCount = inventoryData?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

        // Get current rank based on level
        const userLevel = getLevelFromXP(user.xp || 0);
        
        // Fetch all active ranks ordered by min_level ascending
        const { data: allRanks } = await supabase
          .from('ranks')
          .select('name, tier, min_level, max_level')
          .eq('is_active', true)
          .order('min_level', { ascending: true });
        
        // Find the highest matching rank by checking from highest to lowest
        let rankData: any = null;
        if (allRanks && allRanks.length > 0) {
          const ranksReversed = [...allRanks].reverse();
          rankData = ranksReversed.find((rank: any) => {
            const minMatches = (rank.min_level || 0) <= userLevel;
            const maxMatches = rank.max_level === null || rank.max_level >= userLevel;
            return minMatches && maxMatches;
          });
          
          // If no match found, use lowest rank
          if (!rankData && allRanks.length > 0) {
            rankData = allRanks[0];
          }
        }

        return {
          ...user,
          inventoryCount: inventoryCount || 0,
          currentRank: rankData?.name || 'Silver I',
          rank_name: rankData?.name || 'Silver I',
          rankTier: rankData?.tier || 0
        };
      })
    );

    return NextResponse.json({
      success: true,
      users: usersWithStats
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, role, coins, gems, xp, level } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const updateData: any = {};
    if (role !== undefined) updateData.role = role;
    if (coins !== undefined) updateData.coins = coins;
    if (gems !== undefined) updateData.gems = gems;
    if (xp !== undefined) updateData.xp = xp;
    if (level !== undefined) updateData.level = level;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: data
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}