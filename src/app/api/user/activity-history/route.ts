import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getAuthSession } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    // Fetch all user activities in parallel
    const [
      bettingHistory,
      gameHistory,
      crateHistory,
      tradeHistory,
      purchaseHistory,
      achievementHistory
    ] = await Promise.all([
      // Betting history
      supabase
        .from('user_bets')
        .select('*')
        .eq('user_id', session.user_id)
        .order('placed_at', { ascending: false })
        .limit(50),
      
      // Game history
      supabase
        .from('game_history')
        .select('*')
        .eq('user_id', session.user_id)
        .order('created_at', { ascending: false })
        .limit(50),
      
      // Crate opening history
      supabase
        .from('user_crate_openings')
        .select('*, crates(name, image)')
        .eq('user_id', session.user_id)
        .order('opened_at', { ascending: false })
        .limit(50),
      
      // Trade-up history
      supabase
        .from('trade_up_contracts')
        .select('*')
        .eq('user_id', session.user_id)
        .order('created_at', { ascending: false })
        .limit(50),
      
      // Purchase history (shop items)
      supabase
        .from('user_inventory')
        .select('item_name, value, obtained_from, acquired_at, image_url, rarity')
        .eq('user_id', session.user_id)
        .eq('obtained_from', 'shop')
        .order('acquired_at', { ascending: false })
        .limit(50),
      
      // Achievement unlocks
      supabase
        .from('user_achievements')
        .select('unlocked_at, achievements(name, description, xp_reward, coin_reward)')
        .eq('user_id', session.user_id)
        .order('unlocked_at', { ascending: false })
        .limit(50)
    ]);

    // Combine and format all activities
    const allActivities: any[] = [];

    // Add betting history
    if (bettingHistory.data) {
      bettingHistory.data.forEach(bet => {
        allActivities.push({
          type: 'bet',
          timestamp: bet.placed_at,
          data: {
            matchId: bet.match_id,
            amount: bet.amount,
            prediction: bet.prediction,
            status: bet.status,
            payout: bet.payout
          }
        });
      });
    }

    // Add game history
    if (gameHistory.data) {
      gameHistory.data.forEach(game => {
        allActivities.push({
          type: 'game',
          timestamp: game.created_at,
          data: {
            gameType: game.game_type,
            bet: game.bet_amount,
            multiplier: game.multiplier,
            payout: game.payout,
            result: game.result
          }
        });
      });
    }

    // Add crate openings
    if (crateHistory.data) {
      crateHistory.data.forEach(opening => {
        allActivities.push({
          type: 'crate_opening',
          timestamp: opening.opened_at,
          data: {
            crateId: opening.crate_id,
            crateName: (opening as any).crates?.name,
            crateImage: (opening as any).crates?.image,
            itemReceived: opening.item_received
          }
        });
      });
    }

    // Add trade-ups
    if (tradeHistory.data) {
      tradeHistory.data.forEach(trade => {
        allActivities.push({
          type: 'trade_up',
          timestamp: trade.created_at,
          data: {
            inputItems: trade.input_items,
            outputItemId: trade.output_item_id
          }
        });
      });
    }

    // Add purchases
    if (purchaseHistory.data) {
      purchaseHistory.data.forEach(purchase => {
        allActivities.push({
          type: 'purchase',
          timestamp: purchase.acquired_at,
          data: {
            itemName: purchase.item_name,
            value: purchase.value,
            image: purchase.image_url,
            rarity: purchase.rarity
          }
        });
      });
    }

    // Add achievements
    if (achievementHistory.data) {
      achievementHistory.data.forEach(achievement => {
        allActivities.push({
          type: 'achievement',
          timestamp: achievement.unlocked_at,
          data: {
            name: (achievement as any).achievements?.name,
            description: (achievement as any).achievements?.description,
            xpReward: (achievement as any).achievements?.xp_reward,
            coinReward: (achievement as any).achievements?.coin_reward
          }
        });
      });
    }

    // Sort all activities by timestamp (most recent first)
    allActivities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      activities: allActivities,
      totalActivities: allActivities.length
    });

  } catch (error) {
    console.error('Activity history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

