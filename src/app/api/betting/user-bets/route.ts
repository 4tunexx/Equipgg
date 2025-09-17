import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';
import { getDb, getAll } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return createUnauthorizedResponse();
    }

    const userId = session.user_id;

    // Fetch user bets from database
    const db = await getDb();
    const bets = getAll(`
      SELECT 
        ub.id,
        ub.match_id,
        ub.team_id,
        ub.amount,
        ub.odds,
        ub.potential_payout,
        ub.status,
        ub.result,
        ub.payout,
        ub.created_at
      FROM user_bets ub
      WHERE ub.user_id = ?
      ORDER BY ub.created_at DESC
    `, [userId]);

    // Format bets for frontend (we'll use mock match data for now since we don't have a matches table)
    const formattedBets = bets.map((bet: any) => ({
      id: bet.id,
      match: {
        id: bet.match_id,
        team1: { name: 'Team A', logo: 'https://picsum.photos/32/32?random=1' },
        team2: { name: 'Team B', logo: 'https://picsum.photos/32/32?random=2' }
      },
      team: {
        name: bet.team_id,
        logo: 'https://picsum.photos/32/32?random=3'
      },
      amount: bet.amount,
      potentialWinnings: bet.potential_payout,
      status: bet.status === 'pending' ? 'Active' : 
              bet.result === 'won' ? 'Won' : 'Lost',
      createdAt: bet.created_at
    }));

    return NextResponse.json({ bets: formattedBets });

  } catch (error) {
    console.error('Failed to fetch user bets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}