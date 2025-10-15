import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get recent purchases from shop
    const { data: purchases } = await supabase
      .from('user_inventory')
      .select(`
        id,
        item_name,
        item_type,
        item_rarity,
        created_at,
        user_id,
        users!inner(username, avatar)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get recent game history (wins/losses on crash, matches, etc)
    const { data: gameHistory } = await supabase
      .from('game_history')
      .select(`
        id,
        game_type,
        bet_amount,
        winnings,
        result,
        created_at,
        user_id,
        users!inner(username, avatar)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get recent activity feed entries (if table exists)
    const { data: activityFeed } = await supabase
      .from('activity_feed')
      .select(`
        id,
        activity_type,
        description,
        amount,
        item_name,
        created_at,
        user_id,
        users!inner(username, avatar)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    const activities: any[] = [];

    // Process purchases
    if (purchases) {
      purchases.forEach(purchase => {
        const user = Array.isArray(purchase.users) ? purchase.users[0] : purchase.users;
        activities.push({
          id: `purchase_${purchase.id}`,
          type: 'crate',
          message: `purchased ${purchase.item_name}`,
          item: purchase.item_name,
          timestamp: purchase.created_at,
          user: {
            username: user?.username || 'Anonymous',
            avatar: user?.avatar || '/default-avatar.png',
            role: 'player'
          }
        });
      });
    }

    // Process game history
    if (gameHistory) {
      gameHistory.forEach(game => {
        if (game.result === 'win' && game.winnings > 0) {
          const user = Array.isArray(game.users) ? game.users[0] : game.users;
          activities.push({
            id: `game_${game.id}`,
            type: 'win',
            message: `won ${Math.floor(game.winnings)} coins on ${game.game_type}`,
            amount: Math.floor(game.winnings),
            gameType: game.game_type,
            multiplier: game.bet_amount > 0 ? +(game.winnings / game.bet_amount).toFixed(2) : 1,
            timestamp: game.created_at,
            user: {
              username: user?.username || 'Anonymous',
              avatar: user?.avatar || '/default-avatar.png',
              role: 'player'
            }
          });
        }
      });
    }

    // Process activity feed entries
    if (activityFeed) {
      activityFeed.forEach(activity => {
        const user = Array.isArray(activity.users) ? activity.users[0] : activity.users;
        activities.push({
          id: `activity_${activity.id}`,
          type: activity.activity_type || 'achievement',
          message: activity.description || 'completed an action',
          amount: activity.amount,
          item: activity.item_name,
          timestamp: activity.created_at,
          user: {
            username: user?.username || 'Anonymous',
            avatar: user?.avatar || '/default-avatar.png',
            role: 'player'
          }
        });
      });
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Return top 30 most recent activities
    return NextResponse.json({
      activities: activities.slice(0, 30)
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
    
    const { user_id, activity_type, description, amount, item_name } = body;

    if (!user_id || !activity_type || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert into activity_feed table
    const { data, error } = await supabase
      .from('activity_feed')
      .insert({
        user_id,
        activity_type,
        description,
        amount,
        item_name,
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
