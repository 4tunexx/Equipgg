import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-utils';
import { getDb, getAll } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await getDb();

    // Get user's activity history
    let activityHistory = [];
    if (session.user_id) {
      activityHistory = await getAll(`
        SELECT * FROM user_activity_feed 
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 50
      `, [session.user_id]);
    }

    // Get user's betting history (mock for now)
    const bettingHistory = [
      {
        id: 1,
        match: 'Natus Vincere vs FaZe Clan',
        bet: 'Natus Vincere',
        amount: 100,
        odds: 1.85,
        result: 'won',
        payout: 185,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        match: 'G2 vs Astralis',
        bet: 'G2',
        amount: 50,
        odds: 2.1,
        result: 'lost',
        payout: 0,
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Get user's trade-up history (mock for now)
    const tradeUpHistory = [
      {
        id: 1,
        inputItems: ['AK-47 | Redline', 'M4A4 | Howl'],
        outputItem: 'AWP | Dragon Lore',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    return NextResponse.json({
      success: true,
      history: {
        activity: activityHistory,
        betting: bettingHistory,
        tradeUp: tradeUpHistory
      }
    });

  } catch (error) {
    console.error('Error fetching user history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
