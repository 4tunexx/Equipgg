import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from "../../../../lib/auth-utils";
import { supabase } from "../../../../lib/supabase";

// Get active trading users
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const onlineOnly = searchParams.get('online') === 'true';

    let query = supabase
      .from('users')
      .select(`
        id,
        displayname,
        avatar_url,
        level,
        last_login_at,
        created_at,
        role
      `)
      .neq('id', session.user_id); // Exclude current user

    if (search) {
      query = query.ilike('displayname', `%${search}%`);
    }

    if (onlineOnly) {
      // Consider users online if they were active in the last 15 minutes
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      query = query.gte('last_login_at', fifteenMinutesAgo.toISOString());
    }

    const { data: users, error } = await query
      .order('last_login_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get trading statistics for each user
    const usersWithStats = await Promise.all(
      (users || []).map(async (user: any) => {
        // Get trade count
        const { count: totalTrades } = await supabase
          .from('trade_history')
          .select('*', { count: 'exact', head: true })
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

        // Get recent inventory items (sample)
        const { data: recentItems } = await supabase
          .from('user_inventory')
          .select(`
            item:items(id, name, type, rarity, image_url)
          `)
          .eq('user_id', user.id)
          .order('acquired_at', { ascending: false })
          .limit(6);

        const isOnline = user.last_login_at && 
          new Date(user.last_login_at) > new Date(Date.now() - 15 * 60 * 1000);

        return {
          id: user.id,
          displayName: user.displayname || `User${user.id.slice(-4)}`,
          avatar: user.avatar_url,
          level: user.level || 1,
          reputation: 4.5 + Math.random() * 0.5, // Mock reputation for now
          isOnline,
          recentItems: recentItems?.map((i: any) => i.item).filter(Boolean) || [],
          totalTrades: totalTrades || 0,
          successRate: Math.min(95 + Math.random() * 5, 100), // Mock success rate
          lastSeen: user.last_login_at
        };
      })
    );

    return NextResponse.json({
      success: true,
      users: usersWithStats
    });

  } catch (error) {
    console.error('Get trading users error:', error);
    return NextResponse.json({ error: 'Failed to fetch trading users' }, { status: 500 });
  }
}