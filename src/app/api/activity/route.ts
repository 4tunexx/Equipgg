import { NextResponse } from 'next/server';
import { getDb, getAll } from '@/lib/db';
import { formatActivityMessage } from '@/lib/activity-logger';

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
    await getDb();
    
    // Try to get real activity from database with user roles
    let activities: any[] = [];
    try {
      activities = await getAll<any>(`
        SELECT 
          uaf.id, uaf.user_id, uaf.username, uaf.activity_type, uaf.amount, uaf.item_name, 
          uaf.item_rarity, uaf.game_type, uaf.multiplier, uaf.created_at, uaf.activity_data,
          u.role, u.xp, u.level
        FROM user_activity_feed uaf
        LEFT JOIN users u ON uaf.user_id = u.id
        ORDER BY uaf.created_at DESC 
        LIMIT 50
      `);
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
        role: activity.role,
        xp: activity.xp,
        level: activity.level,
        isVip: false // Default to false since column doesn't exist
      }
    }));

    // If no real activities, return some mock data
    if (formattedActivities.length === 0) {
      console.log('No real activities found, returning mock data');
      const mockActivities: ActivityItem[] = [
        {
          id: 'activity-mock-1',
          type: 'win',
          message: 'won 2,500 coins with 2.5x multiplier on crash',
          amount: 2500,
          gameType: 'crash',
          multiplier: 2.5,
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          user: {
            username: 'Admin',
            avatar: 'https://picsum.photos/32/32?random=1',
            role: 'admin',
            xp: 5000,
            level: 5,
            isVip: true
          }
        },
        {
          id: 'activity-mock-2',
          type: 'crate',
          message: 'opened a crate and received ★ Karambit | Fade (Covert)',
          item: '★ Karambit | Fade',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          user: {
            username: 'Moderator',
            avatar: 'https://picsum.photos/32/32?random=2',
            role: 'moderator',
            xp: 3000,
            level: 3,
            isVip: false
          }
        },
        {
          id: 'activity-mock-3',
          type: 'bet',
          message: 'placed a 1,000 coin bet on coinflip',
          amount: 1000,
          gameType: 'coinflip',
          timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
          user: {
            username: 'Player123',
            avatar: 'https://picsum.photos/32/32?random=3',
            role: 'user',
            xp: 1500,
            level: 2,
            isVip: false
          }
        },
        {
          id: 'activity-mock-4',
          type: 'crate',
          message: 'opened a crate and received AWP | Dragon Lore (Covert)',
          item: 'AWP | Dragon Lore',
          timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
          user: {
            username: 'NewPlayer',
            avatar: 'https://picsum.photos/32/32?random=4',
            role: 'user',
            xp: 500,
            level: 1,
            isVip: false
          }
        },
        {
          id: 'activity-mock-5',
          type: 'win',
          message: 'won 15,000 coins with 10x multiplier on crash',
          amount: 15000,
          gameType: 'crash',
          multiplier: 10,
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          user: {
            username: 'LuckyGamer',
            avatar: 'https://picsum.photos/32/32?random=5',
            role: 'user',
            xp: 2500,
            level: 3,
            isVip: true
          }
        },
        {
          id: 'activity-mock-6',
          type: 'crate',
          message: 'opened a crate and received ★ M9 Bayonet | Crimson Web (Covert)',
          item: '★ M9 Bayonet | Crimson Web',
          timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
          user: {
            username: 'KnifeHunter',
            avatar: 'https://picsum.photos/32/32?random=6',
            role: 'user',
            xp: 4000,
            level: 4,
            isVip: true
          }
        },
        {
          id: 'activity-mock-7',
          type: 'achievement',
          message: 'unlocked achievement: High Roller',
          timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
          user: {
            username: 'BigBets',
            avatar: 'https://picsum.photos/32/32?random=7',
            role: 'user',
            xp: 6000,
            level: 6,
            isVip: true
          }
        }
      ];
      
      return NextResponse.json(mockActivities);
    }

    console.log(`Returning ${formattedActivities.length} real activities`);
    return NextResponse.json(formattedActivities);
  } catch (error) {
    console.error('Error fetching activity:', error);
    
    // Return fallback mock data on error
    const fallbackActivities: ActivityItem[] = [
      {
        id: 'fallback-1',
        type: 'win',
        message: 'won 1,000 coins on crash',
        amount: 1000,
        timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
        user: {
          username: 'System',
          avatar: 'https://picsum.photos/32/32?random=99',
          role: 'admin',
          xp: 0,
          level: 1,
          isVip: false
        }
      }
    ];
    
    return NextResponse.json(fallbackActivities);
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