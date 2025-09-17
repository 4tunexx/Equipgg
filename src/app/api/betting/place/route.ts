import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';
import { getDb, getOne, run } from '@/lib/db';
import { getActivePerks, hasOddsBooster } from '@/lib/perk-utils';
import { trackBetPlaced } from '@/lib/mission-tracker';
import { trackBettingAchievement } from '@/lib/achievement-tracker';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const { matchId, teamId, amount, odds } = await request.json();

    // SECURITY: Input validation
    if (!matchId || !teamId || !amount || !odds) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate bet amount
    if (typeof amount !== 'number' || amount <= 0 || amount > 1000000) {
      return NextResponse.json({ error: 'Invalid bet amount' }, { status: 400 });
    }

    // Validate odds
    if (typeof odds !== 'number' || odds < 1.01 || odds > 100) {
      return NextResponse.json({ error: 'Invalid odds' }, { status: 400 });
    }

    // Validate IDs (should be UUIDs)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(matchId) || !uuidRegex.test(teamId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const db = await getDb();
    
    // Get user info
    const user = await getOne<{id: string, coins: number}>('SELECT id, coins FROM users WHERE id = ?', [session.user_id]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has enough coins
    if (amount > user.coins) {
      return NextResponse.json({ 
        error: 'Insufficient coins',
        balance: user.coins 
      }, { status: 400 });
    }

    // Apply odds booster perks
    const activePerks = await getActivePerks(session.user_id);
    const oddsBoost = hasOddsBooster(activePerks);
    const boostedOdds = odds + oddsBoost;
    const potentialPayout = Math.floor(amount * boostedOdds);
    const newBalance = user.coins - amount;
    
    // Update user balance
    await run('UPDATE users SET coins = ? WHERE id = ?', [newBalance, user.id]);
    
    // Create bet record
    const betId = `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await run(`
      INSERT INTO user_bets (id, user_id, match_id, team_id, amount, odds, potential_payout, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [betId, user.id, matchId, teamId, amount, boostedOdds, potentialPayout, 'pending']);
    
    // Record transaction
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await run(`
      INSERT INTO user_transactions (id, user_id, type, amount, currency, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [transactionId, user.id, 'bet_placed', -amount, 'coins', `Bet placed on match ${matchId}`, new Date().toISOString()]);
    
    // Award XP for placing bet
    const rewardResponse = await fetch(`http://localhost:9003/api/xp/award`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        activity_type: 'bet_placed',
        reason: `Bet placed on match ${matchId}`
      })
    });

    let xpAwarded = 0;
    if (rewardResponse.ok) {
      const rewardData = await rewardResponse.json();
      xpAwarded = rewardData.xpAwarded || 0;
    }

    // Track mission progress
    await trackBetPlaced(session.user_id, amount);

    // Track betting achievements
    await trackBettingAchievement(session.user_id, 'placed', odds);

    // Check for betting achievements (legacy system)
    let unlockedAchievements = [];
    try {
      const achievementResponse = await fetch(`http://localhost:9003/api/achievements/betting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          matchId,
          teamId,
          amount,
          odds,
          result: 'placed'
        })
      });
      
      if (achievementResponse.ok) {
        const achievementData = await achievementResponse.json();
        unlockedAchievements = achievementData.unlockedAchievements || [];
      }
    } catch (achievementError) {
      console.error('Achievement check failed:', achievementError);
    }

    // Emit Socket.io events for real-time updates
    if ((global as any).io) {
      // Get user info for the event
      const userInfo = await getOne<{displayName: string}>('SELECT displayName FROM users WHERE id = ?', [session.user_id]);
      
      // Emit bet placed event
      (global as any).io.emit('bet-placed', {
        userId: session.user_id,
        username: userInfo?.displayName || 'Anonymous',
        matchId,
        team: teamId,
        amount,
        timestamp: new Date().toISOString()
      });

      // Emit balance updated event
      (global as any).io.emit('balance-updated', {
        userId: session.user_id,
        coins: newBalance,
        gems: 0, // Will be updated by balance context
        xp: 0, // Will be updated by balance context
        level: 0, // Will be updated by balance context
        timestamp: new Date().toISOString()
      });

      // Emit XP gained event if XP was awarded
      if (xpAwarded > 0) {
        global.io.emit('xp-gained', {
          userId: session.user_id,
          amount: xpAwarded,
          source: 'bet_placed',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Bet placed successfully',
      betId,
      newBalance,
      xpAwarded,
      unlockedAchievements,
      oddsBoost: oddsBoost > 0 ? oddsBoost : undefined,
      bet: {
        id: betId,
        matchId,
        teamId,
        amount,
        odds: boostedOdds,
        potentialPayout,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Betting error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}