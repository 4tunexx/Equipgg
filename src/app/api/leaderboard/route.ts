import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-utils';
import { supabase } from '@/lib/supabase';

// Leaderboard API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'xp';
    const limit = parseInt(searchParams.get('limit') || '50');

    const { data: leaderboard, error } = await supabase
      .from('leaderboard')
      .select(`
        id,
        rank,
        value,
        category,
        user_id
      `)
      .eq('category', category)
      .order('rank', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Leaderboard error:', error);
      return NextResponse.json({ success: true, leaderboard: [] });
    }

    return NextResponse.json({
      success: true,
      leaderboard: leaderboard || [],
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