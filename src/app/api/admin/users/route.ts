import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../../lib/supabase";

export async function GET(request: NextRequest) {
  try {
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
      (users || []).map(async (user) => {
        // Get inventory count
        const { count: inventoryCount } = await supabase
          .from('user_inventory')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Get current rank
        // Use min_level as the XP threshold field (normalized in admin/ranks API)
        const { data: rankData } = await supabase
          .from('ranks')
          .select('name, tier, min_level')
          .lte('min_level', user.xp || 0)
          .order('min_level', { ascending: false })
          .limit(1)
          .single();

        return {
          ...user,
          inventoryCount: inventoryCount || 0,
          currentRank: rankData?.name || 'Unranked',
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