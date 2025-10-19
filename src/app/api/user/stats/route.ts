import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from "../../../../lib/auth-utils";
import { createServerSupabaseClient } from "../../../../lib/supabase";
import { getLevelFromXP } from "../../../../lib/xp-config";

export async function GET(request: NextRequest) {
  try {
    // Get session from cookies (consistent with other endpoints)
    const session = await getAuthSession(request);
    
    if (!session) {
      console.log('No session found for user stats');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    console.log('Fetching stats for user:', session.user_id);
    
    // Get user's basic stats
    let userData;
    try {
      const { data, error: userDataError } = await supabase
        .from('users')
        .select('xp, level, coins, gems')
        .eq('id', session.user_id)
        .single();
      
      if (userDataError) {
        console.error('Error fetching user data:', userDataError);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      userData = data;
    } catch (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
      
    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Calculate level from XP to ensure consistency
    const calculatedLevel = getLevelFromXP(userData.xp || 0);
    // Get betting stats
    const { data: betStats } = await supabase
      .from('user_bets')
      .select('result, payout')
      .eq('user_id', session.user_id);
    const totalBets = betStats?.length || 0;
    const betWinnings = betStats?.reduce((sum, b) => sum + (b.result === 'win' ? b.payout : 0), 0) || 0;
    const betWins = betStats?.filter(b => b.result === 'win').length || 0;
    const betWinRate = totalBets > 0 ? Math.round((betWins / totalBets) * 100) : 0;
    // Get game stats
    const { data: gameStats } = await supabase
      .from('game_history')
      .select('result, winnings')
      .eq('user_id', session.user_id);
    const gamesPlayed = gameStats?.length || 0;
    const gameWinnings = gameStats?.reduce((sum, g) => sum + (g.winnings || 0), 0) || 0;
    const gamesWon = gameStats?.filter(g => g.result === 'win').length || 0;
    const gameWinRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
    // Get inventory stats
    const { count: inventoryItems } = await supabase
      .from('user_inventory')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', session.user_id);
    const { data: inventoryValueData } = await supabase
      .from('user_inventory')
      .select('value')
      .eq('user_id', session.user_id);
    const inventoryValue = inventoryValueData?.reduce((sum, i) => sum + (i.value || 0), 0) || 0;
    // Get mission completion stats
    const { data: missionStats } = await supabase
      .from('user_mission_progress')
      .select('completed')
      .eq('user_id', session.user_id);
    const completedMissions = missionStats?.filter(m => m.completed).length || 0;
    const totalMissions = missionStats?.length || 0;
    // Perks/slots (placeholder, needs Supabase perks table if exists)
    const maxInventorySlots = 50; // TODO: add perks logic if needed
    const stats = {
      xp: userData.xp || 0,
      level: calculatedLevel, // Use calculated level from XP
      coins: userData.coins || 0,
      gems: userData.gems || 0,
      totalBets,
      betWinnings,
      betWinRate,
      gamesPlayed,
      gameWinnings,
      gameWinRate,
      inventoryItems: inventoryItems || 0,
      inventoryValue,
      maxInventorySlots,
      completedMissions,
      totalMissions
    };
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}