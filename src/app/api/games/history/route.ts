import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { getAuthSession } from "../../../../lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    const authSession = await getAuthSession(request);
    if (!authSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const gameType = searchParams.get('game_type') || searchParams.get('gameType');

    let query = supabase
      .from('game_history')
      .select(`
        id,
        game_type,
        bet_amount,
        multiplier,
        winnings,
        profit,
        created_at,
        game_data,
        result,
        tiles_cleared,
        xp_gained
      `)
      .eq('user_id', authSession.user_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (gameType) {
      query = query.eq('game_type', gameType);
    }

    const { data: history, error } = await query;

    if (error) throw error;

    // Calculate summary statistics
    const { data: stats, error: statsError } = await supabase
      .from('game_history')
      .select('bet_amount, profit')
      .eq('user_id', authSession.user_id);

    if (statsError) throw statsError;

    const totalBets = stats?.length || 0;
    const totalWagered = stats?.reduce((sum: number, game: any) => sum + (game.bet_amount || 0), 0) || 0;
    const totalProfitLoss = stats?.reduce((sum: number, game: any) => sum + (game.profit || 0), 0) || 0;
    const wins = stats?.filter((game: any) => (game.profit || 0) > 0).length || 0;
    const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;

    return NextResponse.json({
      history: history || [],
      pagination: {
        offset,
        limit,
        hasMore: (history?.length || 0) === limit
      },
      stats: {
        totalBets,
        totalWagered,
        totalProfitLoss,
        wins,
        losses: totalBets - wins,
        winRate: Math.round(winRate * 100) / 100
      }
    });
  } catch (error) {
    console.error('Error fetching game history:', error);
    return NextResponse.json({ error: 'Failed to fetch game history' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authSession = await getAuthSession(request);
    if (!authSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { game_type, bet_amount, multiplier, winnings, profit, game_data, result, tiles_cleared, xp_gained } = body;

    if (!game_type || bet_amount === undefined) {
      return NextResponse.json({ 
        error: 'game_type and bet_amount are required' 
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('game_history')
      .insert({
        id: `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: authSession.user_id,
        game_type,
        bet_amount,
        multiplier: multiplier || null,
        winnings: winnings || 0,
        profit: profit || (winnings || 0) - bet_amount,
        game_data: game_data || '',
        result: result || '',
        tiles_cleared: tiles_cleared || 0,
        xp_gained: xp_gained || 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ game: data });
  } catch (error) {
    console.error('Error creating game history entry:', error);
    return NextResponse.json({ error: 'Failed to create game history entry' }, { status: 500 });
  }
}
