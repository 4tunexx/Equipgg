import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';
import { getDb, getAll } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const db = await getDb();
    
    // Get user's recent activity from various tables
    const activities: any[] = [];

    // Get recent game history
    const gameHistory = await getAll<{
      id: string;
      game_type: string;
      bet_amount: number;
      winnings: number;
      result: string;
      created_at: string;
    }>(`
      SELECT id, game_type, bet_amount, winnings, result, created_at
      FROM game_history 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `, [session.user_id]);

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

    // Get recent transactions
    const transactions = await getAll<{
      id: string;
      type: string;
      amount: number;
      description: string;
      created_at: string;
    }>(`
      SELECT id, type, amount, description, created_at
      FROM user_transactions 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `, [session.user_id]);

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

    // Get recent mission progress
    const missionProgress = await getAll<{
      mission_id: string;
      progress: number;
      completed: boolean;
      last_updated: string;
    }>(`
      SELECT mission_id, progress, completed, last_updated
      FROM user_mission_progress 
      WHERE user_id = ? 
      ORDER BY last_updated DESC 
      LIMIT 5
    `, [session.user_id]);

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

    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      activities: activities.slice(0, 20) // Return top 20 most recent
    });

  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json({ error: 'Failed to fetch user activity' }, { status: 500 });
  }
}