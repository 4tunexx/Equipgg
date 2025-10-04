// Comprehensive XP Service for Progressive Leveling System
import { supabase } from './supabase';
import { 
  getXPForLevel, 
  getLevelFromXP, 
  getLevelInfo, 
  defaultXPConfig, 
  type XPConfig, 
  type LevelInfo 
} from './xp-config';

export interface XPTransaction {
  id: string;
  userId: string;
  amount: number;
  source: string;
  reason: string;
  timestamp: string;
}

export interface XPResult {
  success: boolean;
  newXP: number;
  newLevel: number;
  leveledUp: boolean;
  levelsGained: number;
  levelInfo: LevelInfo;
  transaction?: XPTransaction;
  error?: string;
}

/**
 * Add XP to a user's account with proper level calculation and database updates
 */
export async function addXP(
  userId: string, 
  amount: number, 
  source: string, 
  reason: string = 'XP Award',
  config: XPConfig = defaultXPConfig
): Promise<XPResult> {
  try {
    if (!userId || amount <= 0) {
      return {
        success: false,
        newXP: 0,
        newLevel: 1,
        leveledUp: false,
        levelsGained: 0,
        levelInfo: getLevelInfo(0, config),
        error: 'Invalid userId or amount'
      };
    }

    // Get current user stats
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('xp, level')
      .eq('id', userId)
      .maybeSingle();
    if (userError || !user) {
      return {
        success: false,
        newXP: 0,
        newLevel: 1,
        leveledUp: false,
        levelsGained: 0,
        levelInfo: getLevelInfo(0, config),
        error: 'User not found'
      };
    }

    const oldXP = user.xp;
    const oldLevel = user.level;
    const newXP = oldXP + amount;
    const newLevel = getLevelFromXP(newXP, config);
    const leveledUp = newLevel > oldLevel;
    const levelsGained = newLevel - oldLevel;

    // Update user stats in database
    await supabase
      .from('users')
      .update({ xp: newXP, level: newLevel })
      .eq('id', userId);

    // Create transaction record
    const transactionId = `xp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const transaction: XPTransaction = {
      id: transactionId,
      userId,
      amount,
      source,
      reason,
      timestamp: new Date().toISOString()
    };

    // Record XP transaction
    await supabase.from('user_transactions').insert([
      {
        id: transactionId,
        user_id: userId,
        type: 'xp_award',
        amount,
        currency: 'xp',
        description: `${reason} (+${amount} XP) [${source}]`,
        created_at: new Date().toISOString(),
      },
    ]);

    // Handle level up rewards and notifications
    if (leveledUp) {
      await handleLevelUp(userId, oldLevel, newLevel);
    }

    return {
      success: true,
      newXP,
      newLevel,
      leveledUp,
      levelsGained,
      levelInfo: getLevelInfo(newXP, config),
      transaction
    };

  } catch (error) {
    console.error('Error adding XP:', error);
    return {
      success: false,
      newXP: 0,
      newLevel: 1,
      leveledUp: false,
      levelsGained: 0,
      levelInfo: getLevelInfo(0, config),
      error: 'Failed to add XP'
    };
  }
}

/**
 * Get user's current XP and level information
 */
export async function getUserXPInfo(
  userId: string, 
  config: XPConfig = defaultXPConfig
): Promise<{ xp: number; level: number; levelInfo: LevelInfo } | null> {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('xp, level')
      .eq('id', userId)
      .maybeSingle();
    if (userError || !user) {
      return null;
    }
    return {
      xp: user.xp,
      level: user.level,
      levelInfo: getLevelInfo(user.xp, config)
    };
  } catch (error) {
    console.error('Error getting user XP info:', error);
    return null;
  }
}

/**
 * Handle level up rewards, notifications, and achievements
 */
async function handleLevelUp(
  userId: string, 
  oldLevel: number, 
  newLevel: number
): Promise<void> {
  try {
    const levelsGained = newLevel - oldLevel;
    
    // Level up bonus coins (200 coins per level gained)
    const levelUpBonus = levelsGained * 200;
    
    // Update user coins
    // Increment coins by fetching current value and updating
    const { data: userCoins } = await supabase
      .from('users')
      .select('coins')
      .eq('id', userId)
      .maybeSingle();
    if (userCoins) {
      await supabase
        .from('users')
        .update({ coins: userCoins.coins + levelUpBonus })
        .eq('id', userId);
    }

    // Record level up bonus transaction
    await supabase.from('user_transactions').insert([
      {
        id: `levelup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        type: 'level_bonus',
        amount: levelUpBonus,
        currency: 'coins',
        description: `Level ${newLevel} bonus (+${levelUpBonus} coins)`,
        created_at: new Date().toISOString(),
      },
    ]);

    // Give level-up crate keys (1 key per level gained)
    for (let i = 0; i < levelsGained; i++) {
      const { data: existingKey } = await supabase
        .from('user_keys')
        .select('keys_count')
        .eq('user_id', userId)
        .eq('crate_id', 'level-up')
        .maybeSingle();
      if (existingKey) {
        await supabase
          .from('user_keys')
          .update({ keys_count: existingKey.keys_count + 1 })
          .eq('user_id', userId)
          .eq('crate_id', 'level-up');
      } else {
        await supabase.from('user_keys').insert([
          {
            id: `${userId}-level-up`,
            user_id: userId,
            crate_id: 'level-up',
            keys_count: 1,
            acquired_at: new Date().toISOString(),
          },
        ]);
      }
    }

    // Create level up notification
    await supabase.from('notifications').insert([
      {
        id: `levelup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        type: 'level_up',
        title: '⭐ Level Up!',
        message: `Congratulations! You reached Level ${newLevel}! You received ${levelUpBonus} coins and ${levelsGained} Level-Up Crate Key${levelsGained > 1 ? 's' : ''}!`,
        data: JSON.stringify({ 
          level: newLevel, 
          levelsGained,
          rewards: { coins: levelUpBonus, keys: levelsGained } 
        }),
        created_at: new Date().toISOString(),
        read: 0,
      },
    ]);

    // Check for level-up achievements
    await checkLevelAchievements(userId, newLevel);

  } catch (error) {
    console.error('Error handling level up:', error);
  }
}

/**
 * Check and award level-based achievements
 */
async function checkLevelAchievements(userId: string, level: number): Promise<void> {
  try {
    const levelAchievements = [
      { level: 10, title: "Getting Serious", description: "Reach level 10" },
      { level: 25, title: "Quarter Century Club", description: "Reach level 25" },
      { level: 50, title: "Halfway There", description: "Reach level 50" },
      { level: 75, title: "Elite", description: "Reach level 75" },
      { level: 100, title: "The Pinnacle", description: "Reach level 100" },
      { level: 150, title: "Legendary", description: "Reach level 150" },
      { level: 200, title: "Mythical", description: "Reach level 200" }
    ];

    for (const achievement of levelAchievements) {
      if (level === achievement.level) {
        // Check if user already has this achievement
        const { data: existingAchievement } = await supabase
          .from('user_achievements')
          .select('id')
          .eq('user_id', userId)
          .eq('achievement_name', achievement.title)
          .maybeSingle();
        if (!existingAchievement) {
          // Award the achievement
          await supabase.from('user_achievements').insert([
            {
              id: `achievement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              user_id: userId,
              achievement_name: achievement.title,
              category: 'Progression',
              unlocked_at: new Date().toISOString(),
            },
          ]);
          // Create achievement notification
          await supabase.from('notifications').insert([
            {
              id: `achievement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              user_id: userId,
              type: 'achievement',
              title: '🏆 Achievement Unlocked!',
              message: `You unlocked the "${achievement.title}" achievement for reaching Level ${achievement.level}!`,
              data: JSON.stringify({ 
                achievement: achievement.title, 
                level: achievement.level,
                description: achievement.description 
              }),
              created_at: new Date().toISOString(),
              read: 0,
            },
          ]);
        }
      }
    }
  } catch (error) {
    console.error('Error checking level achievements:', error);
  }
}

/**
 * Get XP requirements for multiple levels (useful for frontend display)
 */
export function getXPRequirements(
  startLevel: number = 1, 
  endLevel: number = 20, 
  config: XPConfig = defaultXPConfig
): Array<{ level: number; xpNeeded: number; totalXp: number }> {
  const requirements: Array<{ level: number; xpNeeded: number; totalXp: number }> = [];
  
  for (let i = startLevel; i <= endLevel; i++) {
    const totalXp = getXPForLevel(i, config);
    const xpNeeded = i === 1 ? 0 : totalXp - getXPForLevel(i - 1, config);
    requirements.push({ level: i, xpNeeded, totalXp });
  }
  
  return requirements;
}

/**
 * Validate XP configuration
 */
export function validateXPConfig(config: XPConfig): boolean {
  return (
    config.base > 0 &&
    config.step >= 0 &&
    config.scale >= 0 &&
    Number.isInteger(config.base) &&
    Number.isInteger(config.step) &&
    Number.isInteger(config.scale)
  );
}

/**
 * Test XP progression with given configuration
 */
export function testXPProgression(config: XPConfig = defaultXPConfig): void {
  console.log('🧪 Testing XP Progression with config:', config);
  console.log('Level | Total XP | Level XP | XP to Next');
  console.log('------|----------|----------|-----------');
  
  const testLevels = [1, 5, 10, 20, 30, 50, 75, 100];
  
  for (const level of testLevels) {
    const totalXP = getXPForLevel(level, config);
    const levelXP = level === 1 ? 0 : totalXP - getXPForLevel(level - 1, config);
    const nextLevelXP = getXPForLevel(level + 1, config);
    const xpToNext = nextLevelXP - totalXP;
    
    console.log(`${level.toString().padStart(5)} | ${(totalXP || 0).toLocaleString?.().padStart(8) || '0'.padStart(8)} | ${(levelXP || 0).toLocaleString?.().padStart(8) || '0'.padStart(8)} | ${(xpToNext || 0).toLocaleString?.().padStart(8) || '0'.padStart(8)}`);
  }
}
