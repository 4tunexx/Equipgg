import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';
import { getDb, getOne, run } from '@/lib/db';
import { getActivePerks, calculatePerkEffects } from '@/lib/perk-utils';
import { addXP } from '@/lib/xp-service';
import { defaultXPConfig } from '@/lib/xp-config';

// XP rewards for different activities
const XP_REWARDS = {
  'login': 10,
  'game_win': 25,
  'game_loss': 5,
  'mission_complete': 50,
  'bet_placed': 3,
  'bet_won': 15,
  'crate_opened': 20,
  'item_sold': 8,
  'trade_completed': 12,
  'chat_message': 1,
  'daily_bonus': 100
};

// Coin rewards for different activities
const COIN_REWARDS = {
  'login': 50,
  'daily_bonus': 500,
  'mission_complete': 100,
  'level_up': 200
};

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const { xp, coins, reason = 'Reward', activity_type } = await request.json();

    // Calculate XP and coins based on activity type if not provided
    let finalXp = xp;
    let finalCoins = coins;

    if (activity_type && !xp) {
      finalXp = (XP_REWARDS as any)[activity_type] || 0;
    }
    
    if (activity_type && !coins) {
      finalCoins = (COIN_REWARDS as any)[activity_type] || 0;
    }

    if (!finalXp && !finalCoins) {
      return NextResponse.json({ error: 'XP or coins amount required' }, { status: 400 });
    }

    const db = await getDb();
    
    // Get current user stats
    const user = await getOne<{ xp: number; level: number; coins: number }>(
      'SELECT xp, level, coins FROM users WHERE id = ?',
      [session.user_id]
    );
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get active perks and apply their effects
    const activePerks = await getActivePerks(session.user_id);
    const perkEffects = calculatePerkEffects(activePerks, finalXp || 0, finalCoins || 0, activity_type || '');
    
    // Use the new XP service to add XP
    const xpResult = await addXP(
      session.user_id,
      perkEffects.finalXp,
      activity_type || 'manual',
      reason
    );
    
    if (!xpResult.success) {
      return NextResponse.json({ error: xpResult.error }, { status: 400 });
    }
    
    // Calculate level up bonus coins
    const levelUpBonus = xpResult.leveledUp ? xpResult.levelsGained * COIN_REWARDS.level_up : 0;
    const newCoins = user.coins + perkEffects.finalCoins + levelUpBonus;
    
    // Update user coins
    await run(
      'UPDATE users SET coins = ? WHERE id = ?',
      [newCoins, session.user_id]
    );
    
    // XP transaction is now handled by the XP service
    
    // Record coin transaction if awarded
    if (perkEffects.finalCoins > 0) {
      const coinDescription = perkEffects.appliedPerks.length > 0 
        ? `${reason} (+${perkEffects.finalCoins} coins) [${perkEffects.appliedPerks.join(', ')}]`
        : `${reason} (+${perkEffects.finalCoins} coins)`;
        
      await run(
        `INSERT INTO user_transactions (id, user_id, type, amount, currency, description, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          `coins_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          session.user_id,
          'coin_award',
          perkEffects.finalCoins,
          'coins',
          coinDescription,
          new Date().toISOString()
        ]
      );
    }
    
    // Level up bonus transaction is now handled by the XP service

    // Level up rewards, notifications, and achievements are now handled by the XP service

    // Update mission progress for relevant activities
    if (activity_type) {
      await updateMissionProgress(String(session.user_id), activity_type, perkEffects.finalXp + perkEffects.finalCoins);
    }

    // Emit Socket.io events for real-time updates
    if ((global as any).io) {
      // Emit XP gained event
      (global as any).io.emit('xp-gained', {
        userId: session.user_id,
        amount: perkEffects.finalXp,
        source: activity_type || 'manual',
        newLevel: xpResult.newLevel,
        leveledUp: xpResult.leveledUp,
        timestamp: new Date().toISOString()
      });

      // Emit balance updated event
      (global as any).io.emit('balance-updated', {
        userId: session.user_id,
        coins: newCoins,
        gems: 0, // Will be updated by balance context
        xp: xpResult.newXP,
        level: xpResult.newLevel,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      xpAwarded: perkEffects.finalXp,
      coinsAwarded: perkEffects.finalCoins,
      levelUpBonus,
      newXp: xpResult.newXP,
      newLevel: xpResult.newLevel,
      newCoins,
      leveledUp: xpResult.leveledUp,
      levelsGained: xpResult.levelsGained,
      levelInfo: xpResult.levelInfo,
      appliedPerks: perkEffects.appliedPerks,
      xpMultiplier: perkEffects.xpMultiplier,
      coinMultiplier: perkEffects.coinMultiplier
    });

  } catch (error) {
    console.error('Reward award error:', error);
    return NextResponse.json({ error: 'Failed to award rewards' }, { status: 500 });
  }
}

// Helper function to update mission progress
async function updateMissionProgress(userId: string, activityType: string, rewardAmount: number) {
  try {
    const missionMapping: Record<string, string[]> = {
      'login': ['login', 'main-1'],
      'game_win': ['win-bet', 'main-2'],
      'bet_placed': ['place-bet', 'place-3-bets', 'main-3'],
      'chat_message': ['chatterbox'],
      'crate_opened': ['main-4'],
      'item_sold': ['coin-earner']
    };

    const missionsToUpdate = missionMapping[activityType] || [];
    
    for (const missionId of missionsToUpdate) {
      // Check if user already completed this mission
      const existing = await getOne<{ progress: number; completed: boolean }>(
        'SELECT progress, completed FROM user_mission_progress WHERE user_id = ? AND mission_id = ?',
        [userId, missionId]
      );

      if (existing && existing.completed) {
        continue; // Skip if already completed
      }

      let newProgress = (existing?.progress || 0) + 1;
      let isCompleted = false;

      // Define completion thresholds
      const completionThresholds: Record<string, number> = {
        'login': 1,
        'place-bet': 1,
        'place-3-bets': 3,
        'win-bet': 1,
        'chatterbox': 10,
        'coin-earner': 5,
        'main-1': 1,
        'main-2': 1,
        'main-3': 3,
        'main-4': 1
      };

      if (newProgress >= (completionThresholds[missionId] || 100)) {
        newProgress = completionThresholds[missionId] || 100;
        isCompleted = true;
      }

      if (existing) {
        await run(
          'UPDATE user_mission_progress SET progress = ?, completed = ?, last_updated = ? WHERE user_id = ? AND mission_id = ?',
          [newProgress, isCompleted ? 1 : 0, new Date().toISOString(), userId, missionId]
        );
      } else {
        await run(
          'INSERT INTO user_mission_progress (user_id, mission_id, progress, completed, last_updated) VALUES (?, ?, ?, ?, ?)',
          [userId, missionId, newProgress, isCompleted ? 1 : 0, new Date().toISOString()]
        );
      }

      // Award completion bonus
      if (isCompleted && !existing?.completed) {
        await run(
          `INSERT INTO user_transactions (id, user_id, type, amount, currency, description, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            `mission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            'mission_reward',
            COIN_REWARDS.mission_complete,
            'coins',
            `Mission completed: ${missionId}`,
            new Date().toISOString()
          ]
        );

        // Update user coins
        await run(
          'UPDATE users SET coins = coins + ? WHERE id = ?',
          [COIN_REWARDS.mission_complete, userId]
        );
      }
    }
  } catch (error) {
    console.error('Mission progress update error:', error);
  }
}