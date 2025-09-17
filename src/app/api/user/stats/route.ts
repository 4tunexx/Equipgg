import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';
import { getDb, getOne } from '@/lib/db';
import { getActivePerks, hasInventorySlotPerk } from '@/lib/perk-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const db = await getDb();
    
    // Get user's basic stats
    const user = await getOne<{
      xp: number;
      level: number;
      coins: number;
      gems: number;
    }>('SELECT xp, level, coins, gems FROM users WHERE id = ?', [session.user_id]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get betting stats
    const betStats = await getOne<{
      total_bets: number;
      total_winnings: number;
      wins: number;
    }>(`
      SELECT 
        COUNT(*) as total_bets,
        SUM(CASE WHEN result = 'win' THEN payout ELSE 0 END) as total_winnings,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins
      FROM user_bets 
      WHERE user_id = ?
    `, [session.user_id]);

    // Get game stats
    const gameStats = await getOne<{
      games_played: number;
      games_won: number;
      total_winnings: number;
    }>(`
      SELECT 
        COUNT(*) as games_played,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as games_won,
        SUM(winnings) as total_winnings
      FROM game_history 
      WHERE user_id = ?
    `, [session.user_id]);

    // Get inventory stats
    const inventoryStats = await getOne<{
      total_items: number;
      total_value: number;
    }>(`
      SELECT 
        COUNT(*) as total_items,
        SUM(value) as total_value
      FROM user_inventory 
      WHERE user_id = ?
    `, [session.user_id]);

    // Get mission completion stats
    const missionStats = await getOne<{
      completed_missions: number;
      total_missions: number;
    }>(`
      SELECT 
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_missions,
        COUNT(*) as total_missions
      FROM user_mission_progress 
      WHERE user_id = ?
    `, [session.user_id]);

    // Get active perks (with error handling)
    let activePerks = [];
    let extraInventorySlots = 0;
    try {
      activePerks = await getActivePerks(session.user_id);
      extraInventorySlots = hasInventorySlotPerk(activePerks);
    } catch (perkError) {
      console.error('Error getting active perks:', perkError);
      // Continue without perks if there's an error
    }

    // Calculate win rates
    const betWinRate = (betStats?.total_bets || 0) > 0 ? 
      Math.round(((betStats?.wins || 0) / (betStats?.total_bets || 1)) * 100) : 0;
    
    const gameWinRate = (gameStats?.games_played || 0) > 0 ? 
      Math.round(((gameStats?.games_won || 0) / (gameStats?.games_played || 1)) * 100) : 0;

    const stats = {
      // Basic user stats
      xp: user.xp || 0,
      level: user.level || 1,
      coins: user.coins || 0,
      gems: user.gems || 0,
      
      // Betting stats
      totalBets: betStats?.total_bets || 0,
      betWinnings: betStats?.total_winnings || 0,
      betWinRate,
      
      // Gaming stats  
      gamesPlayed: gameStats?.games_played || 0,
      gameWinnings: gameStats?.total_winnings || 0,
      gameWinRate,
      
      // Inventory stats
      inventoryItems: inventoryStats?.total_items || 0,
      inventoryValue: inventoryStats?.total_value || 0,
      maxInventorySlots: 50 + extraInventorySlots, // Base 50 + perk bonuses
      
      // Mission stats
      completedMissions: missionStats?.completed_missions || 0,
      totalMissions: missionStats?.total_missions || 0,
      missionCompletionRate: (missionStats?.total_missions || 0) > 0 ? 
        Math.round(((missionStats?.completed_missions || 0) / (missionStats?.total_missions || 1)) * 100) : 0,
      
      // Overall stats
      totalWinnings: (betStats?.total_winnings || 0) + (gameStats?.total_winnings || 0),
      overallWinRate: Math.round((betWinRate + gameWinRate) / 2),
      
      // Active perks
      activePerks: activePerks.map(perk => ({
        name: perk.perk_name,
        type: perk.perk_type,
        expiresAt: perk.expires_at
      }))
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ error: 'Failed to fetch user stats' }, { status: 500 });
  }
}