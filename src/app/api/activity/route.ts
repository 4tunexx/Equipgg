import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../lib/supabase";
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

// Simple in-memory cache to reduce database hits
let activitiesCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 10000; // 10 seconds cache

export async function OPTIONS() {
  // Handle CORS preflight requests
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
  
  return new NextResponse(null, { headers });
}

export async function GET() {
  try {
    // Add CORS headers to prevent browser issues
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    // Check cache first
    if (activitiesCache && (Date.now() - activitiesCache.timestamp) < CACHE_TTL) {
      return NextResponse.json(activitiesCache.data, { headers });
    }

    const supabase = createServerSupabaseClient();
    let activities: any[] = [];
    try {
      console.log('Fetching real activities from Supabase...');
      // First check if the activity_feed table exists
      const { data: tableExists, error: tableCheckError } = await supabase
        .from('activity_feed')
        .select('id')
        .limit(1);

      if (tableCheckError) {
        console.error('Activity feed table does not exist or error accessing it:', tableCheckError);
        console.log('Returning sample activities and attempting to create table...');
        
        // Attempt to create the table if it doesn't exist
        try {
          const createTableResponse = await fetch('http://localhost:3000/api/admin/database/create-tables', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          console.log('Create tables response:', createTableResponse.status);
        } catch (createError) {
          console.error('Error creating tables:', createError);
        }
        
        // Return sample activities if table doesn't exist
        return NextResponse.json(generateSampleActivities(), { headers });
      }

      // If we get here, try to fetch activities with all necessary columns
      const { data: activityData, error: activityError } = await supabase
        .from('activity_feed')
        .select(`
          user_id,
          action,
          description,
          metadata,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (activityError) {
        console.log('Database error fetching activities:', activityError);
        console.log('Falling back to sample activities due to Supabase error');
        return NextResponse.json(generateSampleActivities(), { headers });
      }

      activities = activityData || [];
      console.log(`Found ${activities.length} real activities in database`);
      // Only log activity count in development to reduce production log spam
      if (process.env.NODE_ENV === 'development') {
        console.log(`Found ${activities.length} activities in database`);
      }
    } catch (dbError) {
      console.log('Database error fetching activities:', dbError);
      console.log('Falling back to sample activities due to database error');
      activities = [];
    }

    // If no real activities, return sample activities to avoid empty state
    if (activities.length === 0) {
      // Only log this message in development to avoid spam in production
      if (process.env.NODE_ENV === 'development') {
        console.log('No real activities found, returning sample activities');
      }
      
      const sampleActivities = generateSampleActivities();
      
      // Cache the sample activities too
      activitiesCache = {
        data: sampleActivities,
        timestamp: Date.now()
      };
      
      return NextResponse.json(sampleActivities, { headers });
    }

    // Transform activities to match expected format
    const transformedActivities = activities.map((activity, index) => ({
      id: `activity_${index}_${Date.now()}`,
      type: activity.action,
      message: activity.description || activity.action.replace('_', ' ').toUpperCase(),
      amount: activity.metadata?.xp || 0,
      gameType: activity.metadata?.gameType || 'general',
      multiplier: activity.metadata?.multiplier || 1,
      timestamp: activity.created_at,
      user: activity.users ? {
        username: activity.users.username || 'Unknown User',
        avatar: activity.users.avatar_url || '/default-avatar.png',
        role: activity.users.role || 'user',
        xp: activity.users.xp || 0,
        level: activity.users.level || 1,
        isVip: activity.users.is_vip || false
      } : {
        username: 'Unknown User',
        avatar: '/default-avatar.png',
        role: 'user',
        xp: 0,
        level: 1,
        isVip: false
      }
    }));

    // Cache the result
    activitiesCache = {
      data: transformedActivities,
      timestamp: Date.now()
    };

    // Only log in development to reduce production log spam
    if (process.env.NODE_ENV === 'development') {
      console.log(`Returning ${transformedActivities.length} activities`);
    }
    return NextResponse.json(transformedActivities, { headers });
  } catch (error) {
    console.error('Error fetching activity:', error);
    
    // Return cached sample activities if available
    const sampleActivities = generateSampleActivities();
    activitiesCache = {
      data: sampleActivities,
      timestamp: Date.now()
    };
    
    // Add CORS headers to error response
    const errorHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    
    return NextResponse.json(sampleActivities, { headers: errorHeaders });
  }
}

function generateSampleActivities(): ActivityItem[] {
  const activities: ActivityItem[] = [];
  const gameTypes = ['coinflip', 'roulette', 'crash', 'slots', 'jackpot'];
  const items = [
    'AK-47 | Redline',
    'AWP | Dragon Lore', 
    'Karambit | Fade',
    'M4A4 | Howl',
    'Bayonet | Crimson Web',
    'Glock-18 | Gamma Doppler',
    'USP-S | Kill Confirmed',
    'Butterfly Knife | Tiger Tooth'
  ];
  const usernames = ['CsGoKing', 'SkinHunter', 'GamingPro', 'LuckyWinner', 'CrateMaster', 'BladeRunner', 'FireShot', 'IceQueen'];

  for (let i = 0; i < 8; i++) {
    const randomUser = usernames[Math.floor(Math.random() * usernames.length)];
    const randomItem = items[Math.floor(Math.random() * items.length)];
    const randomGame = gameTypes[Math.floor(Math.random() * gameTypes.length)];
    const amount = Math.floor(Math.random() * 500) + 10;
    const isWin = Math.random() > 0.3;
    
    activities.push({
      id: `sample_${i}_${Date.now()}`,
      type: isWin ? 'win' : Math.random() > 0.5 ? 'crate' : 'bet',
      message: isWin 
        ? `won ${amount} coins on ${randomGame}` 
        : `opened a crate and got ${randomItem}`,
      amount: amount,
      item: isWin ? undefined : randomItem,
      gameType: randomGame,
      multiplier: isWin ? +(1 + Math.random() * 3).toFixed(2) : undefined,
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(), // Random time in last 24h
      user: {
        username: randomUser,
        avatar: `https://picsum.photos/32/32?random=${i + 100}`,
        role: Math.random() > 0.8 ? 'vip' : 'player',
        xp: Math.floor(Math.random() * 5000) + 500,
        level: Math.floor(Math.random() * 50) + 1,
        isVip: Math.random() > 0.8
      }
    });
  }

  return activities;
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