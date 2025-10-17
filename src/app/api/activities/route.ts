import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get recent activity feed entries using EXISTING structure
    const { data: activityFeed } = await supabase
      .from('activity_feed')
      .select(`
        id,
        action,
        description,
        metadata,
        created_at,
        user_id,
        users!inner(username, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    const activities: any[] = [];

    // Process activity feed entries
    if (activityFeed) {
      activityFeed.forEach(activity => {
        const user = Array.isArray(activity.users) ? activity.users[0] : activity.users;
        const metadata = activity.metadata || {};
        
        // Determine activity type icon from action
        let type = 'activity';
        if (activity.action?.includes('win') || activity.action?.includes('won')) type = 'win';
        else if (activity.action?.includes('crate')) type = 'crate';
        else if (activity.action?.includes('level')) type = 'level';
        else if (activity.action?.includes('achievement')) type = 'achievement';
        
        activities.push({
          id: `activity_${activity.id}`,
          type,
          message: activity.description || 'completed an action',
          amount: metadata.amount || metadata.xp || 0,
          item: metadata.itemName || null,
          rarity: metadata.itemRarity || null,
          gameType: metadata.gameType || null,
          multiplier: metadata.multiplier || null,
          timestamp: activity.created_at,
          user: {
            username: user?.username || 'Anonymous',
            avatar: user?.avatar_url || '/default-avatar.svg',
            role: 'player'
          }
        });
      });
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Return top 50 most recent activities
    return NextResponse.json({
      activities: activities.slice(0, 50)
    });

  } catch (error) {
    console.error('Error fetching activities:', error);
    // Return empty array instead of error to avoid breaking the UI
    return NextResponse.json({
      activities: []
    });
  }
}

// POST endpoint to log new activities
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    
    const { user_id, action, description, metadata } = body;

    if (!user_id || !action || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert into activity_feed table using EXISTING structure
    const { data, error } = await supabase
      .from('activity_feed')
      .insert({
        user_id,
        action,
        description,
        metadata: metadata || {},
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error logging activity:', error);
      return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 });
    }

    return NextResponse.json({ success: true, activity: data });

  } catch (error) {
    console.error('Error in POST /api/activities:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
