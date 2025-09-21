import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from "../../../../lib/auth-utils";
import { createServerSupabaseClient } from "../../../../lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Use our updated auth session method
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    
    // Get recent game history
    const { data: gameHistory } = await supabase
      .from('game_history')
      .select('id, game_type, bet_amount, winnings, result, created_at')
      .eq('user_id', session.user_id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Get recent transactions
    const { data: transactions } = await supabase
      .from('user_transactions')
      .select('id, type, amount, description, created_at')
      .eq('user_id', session.user_id)
      .order('created_at', { ascending: false })
      .limit(10);
    // Get recent mission progress
    const { data: missionProgress } = await supabase
      .from('user_mission_progress')
      .select('mission_id, progress, completed, last_updated')
      .eq('user_id', session.user_id)
      .order('last_updated', { ascending: false })
      .limit(5);
    // Aggregate activities
    const activities: any[] = [];
    if (gameHistory) {
      gameHistory.forEach(game => {
        activities.push({
          id: game.id,
          type: game.result === 'win' ? 'game_win' : 'game_loss',
          description: `Played ${game.game_type} - ${game.result === 'win' ? 'Won' : 'Lost'} ${game.winnings} coins`,
          amount: game.result === 'win' ? game.winnings : -game.bet_amount,
          timestamp: game.created_at,
          category: 'gaming'
        });
      });
    }
    if (transactions) {
      transactions.forEach(tx => {
        activities.push({
          id: tx.id,
          type: tx.type,
          description: tx.description || `${tx.type} transaction`,
          amount: tx.amount,
          timestamp: tx.created_at,
          category: 'transaction'
        });
      });
    }
    if (missionProgress) {
      missionProgress.forEach(mission => {
        activities.push({
          id: mission.mission_id,
          type: mission.completed ? 'mission_completed' : 'mission_progress',
          description: mission.completed ? 
            `Completed mission: ${mission.mission_id}` : 
            `Progress on mission: ${mission.mission_id} (${mission.progress}%)`,
          timestamp: mission.last_updated,
          category: 'missions'
        });
      });
    }
    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return NextResponse.json({
      activities: activities.slice(0, 20)
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json({ error: 'Failed to fetch user activity' }, { status: 500 });
  }
}