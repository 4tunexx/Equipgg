import { NextResponse } from 'next/server';
import { supabase } from "../../../lib/supabase";
import { createSupabaseQueries } from "../../../lib/supabase/queries";
import { formatActivityMessage } from "../../../lib/activity-logger";

interface ActivityItem {
  id: string;
  type: 'bet' | 'win' | 'crate' | 'trade' | 'achievement';
  message: string;
  amount?: number;
  item?: string;
  gameType?: string;
  multiplier?: number;
  timestamp: string;
  user: {
    username: string;
    avatar: string;
    role?: string;
    xp?: number;
    level?: number;
    isVip?: boolean;
  };
}

export async function GET() {
  try {
    let activities: any[] = [];
    try {
      const { data, error } = await supabase
        .from('activity_feed')
        .select(`
          id,
          user_id,
          username,
          activity_type,
          amount,
          item_name,
          item_rarity,
          game_type,
          multiplier,
          created_at,
          activity_data,
          users (
            role,
            xp,
            level
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        // Check if the error is due to a missing relationship
        if (error.code === '42P01' || error.message.includes('relation')) { // '42P01' is undefined_table
            console.log('Users relation not found on activity_feed, fetching separately.');
            const { data: activityFeed, error: activityFeedError } = await supabase
              .from('activity_feed')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(50);

            if (activityFeedError) throw activityFeedError;

            const userIds = [...new Set(activityFeed.map(a => a.user_id))];
            const { data: users, error: usersError } = await supabase
              .from('users')
              .select('id, role, xp, level')
              .in('id', userIds);

            if (usersError) throw usersError;

            const usersById = users.reduce((acc, user) => {
                acc[user.id] = user;
                return acc;
            }, {} as Record<string, any>);

            activities = activityFeed.map(activity => ({
                ...activity,
                users: usersById[activity.user_id] || null
            }));

        } else {
            throw error;
        }
      } else {
        activities = data;
      }

      console.log(`Found ${activities.length} real activities in database`);
    } catch (dbError) {
      console.log('Database error fetching activities:', dbError);
      activities = [];
    }

    // Transform to expected format
    const formattedActivities: ActivityItem[] = activities.map(activity => ({
      id: activity.id,
      type: getActivityType(activity.activity_type),
      message: formatActivityMessage(activity),
      amount: activity.amount,
      item: activity.item_name,
      gameType: activity.game_type,
      multiplier: activity.multiplier,
      timestamp: activity.created_at,
      user: {
        username: activity.username,
        avatar: `https://picsum.photos/32/32?random=${Math.abs(activity.username.charCodeAt(0) % 100)}`,
        role: activity.users?.role,
        xp: activity.users?.xp,
        level: activity.users?.level,
        isVip: false // Default to false since column doesn't exist
      }
    }));

    // Return empty array if no activities found
    if (formattedActivities.length === 0) {
      console.log('No activities found, returning empty array');
      return NextResponse.json([]);
    }

    console.log(`Returning ${formattedActivities.length} real activities`);
    return NextResponse.json(formattedActivities);
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getActivityType(activityType: string): 'bet' | 'win' | 'crate' | 'trade' | 'achievement' {
  switch (activityType) {
    case 'game_win':
    case 'bet_won':
      return 'win';
    case 'bet_placed':
      return 'bet';
    case 'crate_open':
      return 'crate';
    case 'trade_up':
      return 'trade';
    case 'achievement_unlock':
    case 'level_up':
      return 'achievement';
    default:
      return 'win';
  }
}