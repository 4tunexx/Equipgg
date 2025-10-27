import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-utils';
import { createServerSupabaseClient } from '@/lib/supabase';

// Leaderboard API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'xp';
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = createServerSupabaseClient();
    
    // Fetch top users directly from users table based on category
    let query = supabase
      .from('users')
      .select('id, username, displayname, avatar_url, xp, level, coins, role')
      .eq('is_deleted', false)
      .limit(limit);

    // Order by category
    if (category === 'xp') {
      query = query.order('xp', { ascending: false });
    } else if (category === 'coins') {
      query = query.order('coins', { ascending: false });
    } else {
      query = query.order('xp', { ascending: false });
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('Leaderboard error:', error);
      return NextResponse.json({ success: true, players: [] });
    }

    // Format response with rank positions
    const players = (users || []).map((user, index) => ({
      id: user.id,
      user_id: user.id,
      name: user.displayname || user.username || 'Unknown',
      username: user.username || user.displayname || 'Unknown',
      avatar_url: user.avatar_url,
      avatar: user.avatar_url,
      xp: user.xp || 0,
      coins: user.coins || 0,
      level: user.level || 1,
      position: index + 1,
      rank: user.role || 'user'
    }));

    return NextResponse.json({
      success: true,
      players: players || [],
      category
    });

  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}

// Update leaderboard (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    
    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user_id)
      .single();

    if (!user || !['admin', 'moderator'].includes(user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { category, userId, value } = await request.json();

    if (!category || !userId || value === undefined) {
      return NextResponse.json({ 
        error: 'Category, userId, and value are required' 
      }, { status: 400 });
    }

    // Call the update function
    const { error } = await supabase.rpc('update_leaderboard', {
      p_category: category,
      p_user_id: userId,
      p_value: value
    });

    if (error) {
      console.error('Update leaderboard error:', error);
      return NextResponse.json({ error: 'Failed to update leaderboard' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Leaderboard updated successfully'
    });

  } catch (error) {
    console.error('Update leaderboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}