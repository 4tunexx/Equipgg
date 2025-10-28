import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    console.log('🌐 PRESTIGE FEED: Fetching global activities...');
    
    // Get recent activity feed entries from ALL users
    // Show wins, crate openings, achievements, and level ups
    const { data: activityFeed, error: activityError } = await supabase
      .from('activity_feed')
      .select(`
        id,
        action,
        description,
        metadata,
        created_at,
        user_id
      `)
      .in('action', ['won_game', 'opened_crate', 'leveled_up', 'unlocked_achievement'])
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (activityError) {
      console.error('❌ Error fetching activities:', activityError);
      return NextResponse.json({ activities: [] });
    }
    
    console.log('📊 Found activities:', activityFeed?.length || 0);
    
    if (!activityFeed || activityFeed.length === 0) {
      console.log('⚠️ No activities found in database');
      return NextResponse.json({ activities: [] });
    }
    
    // Get unique user IDs
    const userIds = [...new Set(activityFeed.map(a => a.user_id))];
    console.log('👥 Fetching user data for', userIds.length, 'users');
    
    // Fetch user data separately to avoid join issues
    const { data: users } = await supabase
      .from('users')
      .select('id, username, avatar_url')
      .in('id', userIds);
    
    // Create a map for quick user lookup
    const userMap = new Map(users?.map(u => [u.id, u]) || []);

    // Process activity feed entries with user data
    const activities = activityFeed.map(activity => {
      const user = userMap.get(activity.user_id);
      const metadata = activity.metadata || {};
      
      // Determine activity type icon from action
      let type = 'bet';
      if (activity.action === 'won_game') type = 'win';
      else if (activity.action === 'opened_crate') type = 'crate';
      else if (activity.action === 'leveled_up') type = 'achievement';
      else if (activity.action === 'unlocked_achievement') type = 'achievement';
      
      // Create a nice message
      let message = activity.description;
      if (activity.action === 'won_game') {
        const gameType = metadata.gameType || 'game';
        const amount = metadata.amount || metadata.coins || 0;
        message = `won ${amount} coins on ${gameType}`;
      } else if (activity.action === 'opened_crate') {
        const itemName = metadata.itemName || 'an item';
        message = `opened a crate and got ${itemName}`;
      } else if (activity.action === 'leveled_up') {
        const level = metadata.newLevel || metadata.level || '?';
        message = `reached level ${level}`;
      } else if (activity.action === 'unlocked_achievement') {
        const achievement = metadata.achievementName || 'an achievement';
        message = `unlocked ${achievement}`;
      }
      
      return {
        id: `activity_${activity.id}`,
        type,
        message: message || 'completed an action',
        amount: metadata.amount || metadata.coins || metadata.xp || undefined,
        item: metadata.itemName || null,
        rarity: metadata.itemRarity || null,
        gameType: metadata.gameType || null,
        multiplier: metadata.multiplier || null,
        timestamp: activity.created_at,
        user: {
          username: (user as any)?.username || 'Player',
          avatar: (user as any)?.avatar_url || '/default-avatar.svg',
          role: 'player'
        }
      };
    });
    
    console.log('✅ Processed', activities.length, 'activities for prestige feed');

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
