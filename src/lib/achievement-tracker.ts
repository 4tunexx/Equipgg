import { getDb, run, getOne, getAll } from './db';

export interface AchievementUpdate {
  userId: string;
  action: string;
  value?: number;
  metadata?: any;
}

export async function checkAndUnlockAchievements(update: AchievementUpdate) {
  try {
    const db = await getDb();
    
    // Get all active achievements that match this action
    const achievements = await getAll(`
      SELECT id, name, description, category, requirement_type, requirement_value, xp_reward, coin_reward, gem_reward, icon
      FROM achievements 
      WHERE is_active = 1 AND requirement_type = ?
    `, [update.action]);

    for (const achievement of achievements) {
      // Check if user already has this achievement
      const existingAchievement = await getOne(
        'SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
        [update.userId, achievement.id as string]
      );

      if (existingAchievement) continue;

      let shouldUnlock = false;
      let currentProgress = 0;

      // Check achievement conditions based on type
      switch (achievement.requirement_type) {
        case 'place_bet':
        case 'win_bet':
        case 'play_crash':
        case 'play_coinflip':
        case 'play_sweeper':
        case 'forum_post':
        case 'cast_vote':
        case 'open_crate':
        case 'shop_purchase':
        case 'reach_level':
          // Simple count-based achievements
          currentProgress = await getAchievementProgress(update.userId, achievement.requirement_type as string);
          shouldUnlock = currentProgress >= (achievement.requirement_value as number);
          break;

        case 'win_streak':
          // Check for win streak
          currentProgress = await getWinStreak(update.userId);
          shouldUnlock = currentProgress >= (achievement.requirement_value as number);
          break;

        case 'crash_win_streak':
          // Check for crash win streak
          currentProgress = await getCrashWinStreak(update.userId);
          shouldUnlock = currentProgress >= (achievement.requirement_value as number);
          break;

        case 'crash_cashout_3x':
          // Check if user has cashed out at 3x or higher
          shouldUnlock = await hasCrashedOutAt3x(update.userId);
          break;

        case 'sweeper_clear_10':
          // Check if user has cleared 10 tiles in sweeper
          shouldUnlock = await hasCleared10Tiles(update.userId);
          break;

        case 'high_odds_win':
          // Check if user has won a bet with high odds
          shouldUnlock = await hasWonHighOddsBet(update.userId);
          break;

        case 'jackpot_win':
          // Check if user has won a jackpot (10x+ multiplier)
          shouldUnlock = await hasWonJackpot(update.userId);
          break;

        case 'daily_login_streak':
          // Check daily login streak
          currentProgress = await getDailyLoginStreak(update.userId);
          shouldUnlock = currentProgress >= (achievement.requirement_value as number);
          break;

        case 'shop_spend':
          // Check total shop spending
          currentProgress = await getTotalShopSpending(update.userId);
          shouldUnlock = currentProgress >= (achievement.requirement_value as number);
          break;

        default:
          // Default to simple increment
          currentProgress = await getAchievementProgress(update.userId, achievement.requirement_type as string);
          shouldUnlock = currentProgress >= (achievement.requirement_value as number);
      }

      // Unlock achievement if conditions are met
      if (shouldUnlock) {
        await unlockAchievement(update.userId, achievement);
      }
    }

  } catch (error) {
    console.error('Error checking achievements:', error);
  }
}

async function getAchievementProgress(userId: string, actionType: string): Promise<number> {
  try {
    switch (actionType) {
      case 'place_bet':
        const betCount = await getOne(
          'SELECT COUNT(*) as count FROM user_bets WHERE user_id = ?',
          [userId]
        );
        return (betCount?.count as number) || 0;

      case 'win_bet':
        const winCount = await getOne(
          'SELECT COUNT(*) as count FROM user_bets WHERE user_id = ? AND result = ?',
          [userId, 'win']
        );
        return (winCount?.count as number) || 0;

      case 'play_crash':
        const crashCount = await getOne(
          'SELECT COUNT(*) as count FROM game_history WHERE user_id = ? AND game_type = ?',
          [userId, 'crash']
        );
        return (crashCount?.count as number) || 0;

      case 'play_coinflip':
        const coinflipCount = await getOne(
          'SELECT COUNT(*) as count FROM game_history WHERE user_id = ? AND game_type = ?',
          [userId, 'coinflip']
        );
        return (coinflipCount?.count as number) || 0;

      case 'play_sweeper':
        const sweeperCount = await getOne(
          'SELECT COUNT(*) as count FROM game_history WHERE user_id = ? AND game_type = ?',
          [userId, 'sweeper']
        );
        return (sweeperCount?.count as number) || 0;

      case 'forum_post':
        const postCount = await getOne(
          'SELECT COUNT(*) as count FROM forum_topics WHERE author_id = ?',
          [userId]
        );
        return (postCount?.count as number) || 0;

      case 'cast_vote':
        const voteCount = await getOne(
          'SELECT COUNT(*) as count FROM match_votes WHERE user_id = ?',
          [userId]
        );
        return (voteCount?.count as number) || 0;

      case 'open_crate':
        const crateCount = await getOne(
          'SELECT COUNT(*) as count FROM user_crates WHERE user_id = ?',
          [userId]
        );
        return (crateCount?.count as number) || 0;

      case 'shop_purchase':
        const purchaseCount = await getOne(
          'SELECT COUNT(*) as count FROM user_transactions WHERE user_id = ? AND type = ?',
          [userId, 'purchase']
        );
        return (purchaseCount?.count as number) || 0;

      case 'reach_level':
        const user = await getOne(
          'SELECT level FROM users WHERE id = ?',
          [userId]
        );
        return (user?.level as number) || 1;

      default:
        return 0;
    }
  } catch (error) {
    console.error('Error getting achievement progress:', error);
    return 0;
  }
}

async function getWinStreak(userId: string): Promise<number> {
  try {
    const recentBets = await getAll(
      'SELECT result FROM user_bets WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [userId]
    );

    let streak = 0;
    for (const bet of recentBets) {
      if (bet.result === 'win') {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  } catch (error) {
    console.error('Error getting win streak:', error);
    return 0;
  }
}

async function getCrashWinStreak(userId: string): Promise<number> {
  try {
    const recentCrash = await getAll(
      'SELECT result FROM game_history WHERE user_id = ? AND game_type = ? ORDER BY created_at DESC LIMIT 10',
      [userId, 'crash']
    );

    let streak = 0;
    for (const game of recentCrash) {
      if (game.result === 'win') {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  } catch (error) {
    console.error('Error getting crash win streak:', error);
    return 0;
  }
}

async function hasCrashedOutAt3x(userId: string): Promise<boolean> {
  try {
    const highMultiplier = await getOne(
      'SELECT id FROM game_history WHERE user_id = ? AND game_type = ? AND result = ? AND multiplier >= ?',
      [userId, 'crash', 'win', 3.0]
    );
    return !!highMultiplier;
  } catch (error) {
    console.error('Error checking crash cashout:', error);
    return false;
  }
}

async function hasCleared10Tiles(userId: string): Promise<boolean> {
  try {
    const highTiles = await getOne(
      'SELECT id FROM game_history WHERE user_id = ? AND game_type = ? AND tiles_cleared >= ?',
      [userId, 'sweeper', 10]
    );
    return !!highTiles;
  } catch (error) {
    console.error('Error checking sweeper tiles:', error);
    return false;
  }
}

async function hasWonHighOddsBet(userId: string): Promise<boolean> {
  try {
    const highOdds = await getOne(
      'SELECT id FROM user_bets WHERE user_id = ? AND result = ? AND odds >= ?',
      [userId, 'win', 3.0]
    );
    return !!highOdds;
  } catch (error) {
    console.error('Error checking high odds bet:', error);
    return false;
  }
}

async function hasWonJackpot(userId: string): Promise<boolean> {
  try {
    const jackpot = await getOne(
      'SELECT id FROM game_history WHERE user_id = ? AND result = ? AND multiplier >= ?',
      [userId, 'win', 10.0]
    );
    return !!jackpot;
  } catch (error) {
    console.error('Error checking jackpot:', error);
    return false;
  }
}

async function getDailyLoginStreak(userId: string): Promise<number> {
  try {
    // This would need to be implemented with a proper login tracking system
    // For now, return 0
    return 0;
  } catch (error) {
    console.error('Error getting login streak:', error);
    return 0;
  }
}

async function getTotalShopSpending(userId: string): Promise<number> {
  try {
    const totalSpent = await getOne(
      'SELECT SUM(ABS(amount)) as total FROM user_transactions WHERE user_id = ? AND type = ?',
      [userId, 'purchase']
    );
    return (totalSpent?.total as number) || 0;
  } catch (error) {
    console.error('Error getting shop spending:', error);
    return 0;
  }
}

async function unlockAchievement(userId: string, achievement: any) {
  try {
    const db = await getDb();
    
    // Add achievement to user's achievements
    await run(
      'INSERT INTO user_achievements (user_id, achievement_id, unlocked_at) VALUES (?, ?, ?)',
      [userId, achievement.id, new Date().toISOString()]
    );

    // Award XP
    if (achievement.xp_reward > 0) {
      await run(
        'UPDATE users SET xp = xp + ? WHERE id = ?',
        [achievement.xp_reward, userId]
      );
    }

    // Award coins
    if (achievement.coin_reward > 0) {
      await run(
        'UPDATE users SET coins = coins + ? WHERE id = ?',
        [achievement.coin_reward, userId]
      );
    }

    // Award gems
    if (achievement.gem_reward > 0) {
      await run(
        'UPDATE users SET gems = gems + ? WHERE id = ?',
        [achievement.gem_reward, userId]
      );
    }

    // Log activity
    await run(
      `INSERT INTO user_activity_feed (id, user_id, username, activity_type, item_name, amount, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        'User', // Will be updated with actual username
        'achievement_unlocked',
        achievement.name,
        achievement.xp_reward || 0,
        new Date().toISOString()
      ]
    );

    console.log(`🏆 Achievement unlocked: ${achievement.name} for user ${userId}`);

  } catch (error) {
    console.error('Error unlocking achievement:', error);
  }
}

// Helper functions for common actions
export async function trackBettingAchievement(userId: string, betResult: string, odds?: number) {
  await checkAndUnlockAchievements({ userId, action: 'place_bet' });
  if (betResult === 'win') {
    await checkAndUnlockAchievements({ userId, action: 'win_bet' });
    if (odds && odds >= 3.0) {
      await checkAndUnlockAchievements({ userId, action: 'high_odds_win' });
    }
  }
}

export async function trackGameAchievement(userId: string, gameType: string, result: string, multiplier?: number, tilesCleared?: number) {
  await checkAndUnlockAchievements({ userId, action: `play_${gameType}` });
  
  if (result === 'win') {
    if (gameType === 'crash' && multiplier && multiplier >= 3.0) {
      await checkAndUnlockAchievements({ userId, action: 'crash_cashout_3x' });
    }
    if (gameType === 'sweeper' && tilesCleared && tilesCleared >= 10) {
      await checkAndUnlockAchievements({ userId, action: 'sweeper_clear_10' });
    }
    if (multiplier && multiplier >= 10.0) {
      await checkAndUnlockAchievements({ userId, action: 'jackpot_win' });
    }
  }
}

export async function trackSocialAchievement(userId: string, action: string) {
  await checkAndUnlockAchievements({ userId, action });
}

export async function trackProgressionAchievement(userId: string, newLevel: number) {
  await checkAndUnlockAchievements({ userId, action: 'reach_level', value: newLevel });
}

export async function trackCollectionAchievement(userId: string, action: string) {
  await checkAndUnlockAchievements({ userId, action });
}
