import { NextResponse } from 'next/server';
import { supabase } from "../../../../lib/supabase";

export async function GET() {
  try {
    // Get users who were active in the last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, displayname, avatar_url, role, last_login_at')
      .gte('last_login_at', fifteenMinutesAgo)
      .order('last_login_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching online users:', error);
      return NextResponse.json({ error: 'Failed to fetch online users' }, { status: 500 });
    }

    // Transform users to match ChatUser interface
    const onlineUsers = users.map(user => ({
      id: user.id,
      displayName: user.displayname || user.username || 'Unknown User',
      avatar: user.avatar_url,
      role: user.role || 'user',
      status: 'online' as const,
      lastSeen: user.last_login_at
    }));

    return NextResponse.json({ users: onlineUsers });
  } catch (error) {
    console.error('Error in online-users API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}