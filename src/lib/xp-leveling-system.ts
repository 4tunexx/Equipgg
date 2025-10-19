/**
 * XP and Leveling System for EquipGG
 * Handles XP calculation, level progression, and rewards
 */

import { createServerSupabaseClient } from './supabase';
import { broadcastLevelUp, broadcastXpGained } from './supabase/realtime';
import { createNotification } from './notification-utils';
import { calculateXpWithBoost, getRankByLevel, checkAndAwardBadges } from './badges-ranks-system';

// ============================================================================
// XP CALCULATION
// ============================================================================

/**
 * Calculate XP required for a specific level
 * Formula: 100 * level^1.5 (exponential growth)
 */
export function getXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(level, 1.5));
}

/**
 * Calculate total XP required to reach a level
 */
export function getTotalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 2; i <= level; i++) {
    total += getXpForLevel(i);
  }
  return total;
}

/**
 * Calculate level from total XP
 */
export function getLevelFromXp(totalXp: number): number {
  let level = 1;
  let xpNeeded = 0;
  
  while (xpNeeded <= totalXp) {
    level++;
    xpNeeded += getXpForLevel(level);
  }
  
  return level - 1;
}

/**
 * Get XP progress for current level
 */
export function getXpProgress(totalXp: number): {
  level: number;
  currentLevelXp: number;
  xpForNextLevel: number;
  progress: number;
} {
  const level = getLevelFromXp(totalXp);
  const xpForCurrentLevel = getTotalXpForLevel(level);
  const xpForNextLevel = getXpForLevel(level + 1);
  const currentLevelXp = totalXp - xpForCurrentLevel;
  const progress = (currentLevelXp / xpForNextLevel) * 100;
  
  return {
    level,
    currentLevelXp,
    xpForNextLevel,
    progress: Math.min(progress, 100)
  };
}

// ============================================================================
// XP SOURCES & AMOUNTS
// ============================================================================

export const XP_SOURCES = {
  // Betting
  BET_PLACED: 10,
  BET_WON: 50,
  BET_LOST: 5,
  HIGH_ODDS_WIN: 100, // Winning with odds > 2.0
  
  // Missions
  DAILY_MISSION_COMPLETE: 100,
  WEEKLY_MISSION_COMPLETE: 500,
  SPECIAL_MISSION_COMPLETE: 250,
  
  // Social
  CHAT_MESSAGE: 2,
  FIRST_MESSAGE_OF_DAY: 25,
  
  // Crates
  CRATE_OPENED: 20,
  RARE_ITEM_UNBOXED: 50,
  EPIC_ITEM_UNBOXED: 100,
  LEGENDARY_ITEM_UNBOXED: 250,
  
  // Trading
  TRADE_COMPLETED: 15,
  TRADE_UP_SUCCESS: 75,
  
  // Achievements
  ACHIEVEMENT_UNLOCKED: 200,
  
  // Daily Activities
  DAILY_LOGIN: 50,
  DAILY_LOGIN_STREAK_BONUS: 25, // Per day in streak
  
  // Special Events
  TOURNAMENT_PARTICIPATION: 500,
  TOURNAMENT_WIN: 2000,
  REFERRAL: 300,
} as const;

// ============================================================================
// LEVEL UP REWARDS
// ============================================================================

export interface LevelReward {
  coins?: number;
  gems?: number;
  crateKeys?: number;
  specialItems?: string[];
}

export function getLevelUpReward(newLevel: number): LevelReward {
  const reward: LevelReward = {
    coins: 100 * newLevel,
    gems: 0,
    crateKeys: 0
  };
  
  // Bonus rewards at milestone levels
  if (newLevel % 5 === 0) {
    reward.gems = Math.floor(newLevel / 5) * 10;
  }
  
  if (newLevel % 10 === 0) {
    reward.crateKeys = Math.floor(newLevel / 10);
  }
  
  // Special rewards at major milestones
  if (newLevel === 10) {
    reward.gems = 50;
    reward.crateKeys = 1;
  }
  
  if (newLevel === 25) {
    reward.gems = 100;
    reward.crateKeys = 3;
  }
  
  if (newLevel === 50) {
    reward.gems = 250;
    reward.crateKeys = 5;
    reward.specialItems = ['legendary_crate'];
  }
  
  if (newLevel === 100) {
    reward.gems = 1000;
    reward.crateKeys = 10;
    reward.specialItems = ['legendary_crate', 'exclusive_badge'];
  }
  
  return reward;
}

// ============================================================================
// ADD XP FUNCTION
// ============================================================================

export async function addXp(
  userId: string,
  amount: number,
  source: keyof typeof XP_SOURCES | string,
  metadata?: any
): Promise<{
  success: boolean;
  xpGained: number;
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  rewards?: LevelReward;
}> {
  const supabase = createServerSupabaseClient();
  
  try {
    // Get current user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, xp, level, coins, gems')
      .eq('id', userId)
      .single();
    
    if (userError || !user) {
      console.error('Failed to get user for XP:', userError);
      return {
        success: false,
        xpGained: 0,
        leveledUp: false,
        oldLevel: 1,
        newLevel: 1
      };
    }
    
    // Apply rank XP boost
    const boostedXp = calculateXpWithBoost(amount, user.level);
    const newTotalXp = user.xp + boostedXp;
    const oldLevel = user.level;
    const newLevel = getLevelFromXp(newTotalXp);
    const leveledUp = newLevel > oldLevel;
    
    // Update user XP and level
    const updateData: any = {
      xp: newTotalXp,
      level: newLevel
    };
    
    // Add level up rewards
    let rewards: LevelReward | undefined;
    if (leveledUp) {
      rewards = getLevelUpReward(newLevel);
      updateData.coins = user.coins + (rewards.coins || 0);
      updateData.gems = user.gems + (rewards.gems || 0);
      
      console.log(`🎉 User ${userId} leveled up: ${oldLevel} → ${newLevel}`);
    }
    
    await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);
    
    // Log XP gain
    await supabase
      .from('xp_log')
      .insert({
        user_id: userId,
        amount: boostedXp,
        source,
        metadata,
        created_at: new Date().toISOString()
      });
    
    // Broadcast XP gained
    await broadcastXpGained({
      userId,
      amount: boostedXp,
      source,
      newTotal: newTotalXp,
      timestamp: new Date().toISOString()
    });
    
    // Broadcast level up if applicable
    if (leveledUp && rewards) {
      // Award crate keys for leveling up
      try {
        const { awardLevelUpCrateKey } = await import('./crate-key-rewards');
        await awardLevelUpCrateKey(userId, newLevel);
      } catch (error) {
        console.error('Failed to award level up crate key:', error);
      }

      await broadcastLevelUp({
        userId,
        newLevel,
        xp: newTotalXp,
        rewards: {
          coins: rewards.coins,
          gems: rewards.gems,
          items: rewards.specialItems
        },
        timestamp: new Date().toISOString()
      });
      
      // Create notification for level up
      await createNotification({
        userId,
        type: 'level_up',
        title: '🎉 Level Up!',
        message: `Congratulations! You've reached Level ${newLevel}! You earned ${rewards.coins} coins${rewards.gems ? ` and ${rewards.gems} gems` : ''}!`,
        data: {
          level: newLevel,
          amount: rewards.coins
        }
      });
      
      // Check for level-based badges
      await checkAndAwardBadges(userId, 'level_up', { level: newLevel });
    }
    
    return {
      success: true,
      xpGained: boostedXp,
      leveledUp,
      oldLevel,
      newLevel,
      rewards
    };
  } catch (error) {
    console.error('Error adding XP:', error);
    return {
      success: false,
      xpGained: 0,
      leveledUp: false,
      oldLevel: 1,
      newLevel: 1
    };
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export async function addXpForBetPlaced(userId: string, amount: number) {
  return addXp(userId, XP_SOURCES.BET_PLACED, 'BET_PLACED', { betAmount: amount });
}

export async function addXpForBetWon(userId: string, winnings: number, odds: number) {
  const baseXp = odds > 2.0 ? XP_SOURCES.HIGH_ODDS_WIN : XP_SOURCES.BET_WON;
  return addXp(userId, baseXp, 'BET_WON', { winnings, odds });
}

export async function addXpForBetLost(userId: string) {
  return addXp(userId, XP_SOURCES.BET_LOST, 'BET_LOST');
}

export async function addXpForMissionComplete(userId: string, missionType: 'daily' | 'weekly' | 'special') {
  const xpMap = {
    daily: XP_SOURCES.DAILY_MISSION_COMPLETE,
    weekly: XP_SOURCES.WEEKLY_MISSION_COMPLETE,
    special: XP_SOURCES.SPECIAL_MISSION_COMPLETE
  };
  return addXp(userId, xpMap[missionType], `${missionType.toUpperCase()}_MISSION_COMPLETE`);
}

export async function addXpForChatMessage(userId: string, isFirstOfDay: boolean) {
  const xp = isFirstOfDay ? XP_SOURCES.FIRST_MESSAGE_OF_DAY : XP_SOURCES.CHAT_MESSAGE;
  return addXp(userId, xp, isFirstOfDay ? 'FIRST_MESSAGE_OF_DAY' : 'CHAT_MESSAGE');
}

export async function addXpForCrateOpened(userId: string, itemRarity: string) {
  let xp = XP_SOURCES.CRATE_OPENED;
  
  switch (itemRarity.toLowerCase()) {
    case 'rare':
      xp += XP_SOURCES.RARE_ITEM_UNBOXED;
      break;
    case 'epic':
      xp += XP_SOURCES.EPIC_ITEM_UNBOXED;
      break;
    case 'legendary':
      xp += XP_SOURCES.LEGENDARY_ITEM_UNBOXED;
      break;
  }
  
  return addXp(userId, xp, 'CRATE_OPENED', { itemRarity });
}

export async function addXpForDailyLogin(userId: string, streakDays: number) {
  const bonusXp = XP_SOURCES.DAILY_LOGIN_STREAK_BONUS * Math.min(streakDays, 30);
  const totalXp = XP_SOURCES.DAILY_LOGIN + bonusXp;
  return addXp(userId, totalXp, 'DAILY_LOGIN', { streakDays });
}

export async function addXpForAchievement(userId: string, achievementId: string) {
  return addXp(userId, XP_SOURCES.ACHIEVEMENT_UNLOCKED, 'ACHIEVEMENT_UNLOCKED', { achievementId });
}

// ============================================================================
// LEADERBOARD FUNCTIONS
// ============================================================================

export async function updateLeaderboard(userId: string) {
  const supabase = createServerSupabaseClient();
  
  const { data: user } = await supabase
    .from('users')
    .select('id, username, avatar_url, level, xp, coins')
    .eq('id', userId)
    .single();
  
  if (!user) return;
  
  const rank = getRankByLevel(user.level);
  
  await supabase
    .from('leaderboard')
    .upsert({
      user_id: userId,
      username: user.username,
      avatar_url: user.avatar_url,
      level: user.level,
      xp: user.xp,
      coins: user.coins,
      rank: rank.name,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });
}

export async function getTopPlayers(limit: number = 100) {
  const supabase = createServerSupabaseClient();
  
  const { data: players } = await supabase
    .from('leaderboard')
    .select('*')
    .order('xp', { ascending: false })
    .limit(limit);
  
  return players || [];
}

export async function getUserRank(userId: string): Promise<number> {
  const supabase = createServerSupabaseClient();
  
  const { data: user } = await supabase
    .from('users')
    .select('xp')
    .eq('id', userId)
    .single();
  
  if (!user) return 0;
  
  const { count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gt('xp', user.xp);
  
  return (count || 0) + 1;
}
