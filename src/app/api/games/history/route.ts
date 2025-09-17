import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';
import { getDb, getAll, getOne } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const gameType = searchParams.get('gameType');
    const limit = parseInt(searchParams.get('limit') || '5');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get database connection
    const db = await getDb();
    
    // Get user info for display
    const user = await getOne<{ displayName: string, avatar_url: string }>(
      'SELECT displayName, avatar_url FROM users WHERE id = ?',
      [session.user_id]
    );
    
    // Build query with optional game type filter - get ALL games, not just current user's
    let query = `
      SELECT gh.id, gh.game_type, gh.bet_amount, gh.winnings, gh.profit, gh.multiplier, gh.game_data, gh.result, gh.created_at,
             u.displayName, u.avatar_url, u.id as user_id, u.role, u.xp, u.level
      FROM game_history gh
      JOIN users u ON gh.user_id = u.id
    `;
    const queryParams: (number | string)[] = [];
    
    if (gameType) {
      query += ' WHERE gh.game_type = ?';
      queryParams.push(gameType);
    }
    
    query += ' ORDER BY gh.created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);
    
    // Fetch game history from database
    const gameHistoryRows = await getAll<{
      id: string;
      game_type: string;
      bet_amount: number;
      winnings: number;
      profit: number;
      multiplier: number;
      game_data: string;
      result: string;
      created_at: string;
      displayName: string;
      avatar_url: string;
      user_id: string;
      role: string;
      xp: number;
      level: number;
    }>(query, queryParams);
    
    // Transform database results to expected format
    const gameHistory = gameHistoryRows.map(row => ({
      id: row.id,
      gameType: row.game_type,
      betAmount: row.bet_amount,
      winnings: row.winnings,
      profit: row.profit,
      multiplier: row.multiplier,
      result: JSON.parse(row.game_data),
      timestamp: row.created_at,
      user: {
        id: row.user_id,
        name: row.displayName || 'Player',
        avatar: row.avatar_url || null,
        role: row.role || 'user',
        xp: row.xp || 0,
        level: row.level || 1
      }
    }));
    
    const paginatedHistory = gameHistory;

    // Get total count for stats (without pagination) - count ALL games
    let countQuery = 'SELECT COUNT(*) as total FROM game_history gh';
    const countParams: (number | string)[] = [];
    
    if (gameType) {
      countQuery += ' WHERE gh.game_type = ?';
      countParams.push(gameType);
    }
    
    const totalResult = await getOne<{ total: number }>(countQuery, countParams);
    const totalGames = totalResult?.total || 0;
    
    // Calculate stats from current page data
    const totalWagered = gameHistory.reduce((sum, game) => sum + game.betAmount, 0);
    const totalWinnings = gameHistory.reduce((sum, game) => sum + game.winnings, 0);
    const totalProfit = gameHistory.reduce((sum, game) => sum + game.profit, 0);
    const winRate = gameHistory.length > 0 ? (gameHistory.filter(game => game.profit > 0).length / gameHistory.length) * 100 : 0;
    const biggestWin = gameHistory.length > 0 ? Math.max(...gameHistory.map(game => game.profit), 0) : 0;
    const biggestLoss = gameHistory.length > 0 ? Math.min(...gameHistory.map(game => game.profit), 0) : 0;

    return NextResponse.json({
      history: paginatedHistory,
      stats: {
        totalGames,
        totalWagered,
        totalWinnings,
        totalProfit,
        winRate: Math.round(winRate * 100) / 100,
        biggestWin,
        biggestLoss: Math.abs(biggestLoss)
      },
      pagination: {
        limit,
        offset,
        total: totalGames,
        hasMore: offset + limit < totalGames
      }
    });

  } catch (error) {
    console.error('Game history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}