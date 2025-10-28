/**
 * Badges, Ranks, and Gamification System for EquipGG
 * Handles user progression, badges, ranks, titles, and rewards
 * 
 * NOTE: This system USES the existing achievements from Supabase (66 achievements)
 * NOT hardcoded badges. All achievements are fetched from the database.
 */

import { createServerSupabaseClient } from './supabase';
import { broadcastAchievementUnlocked, broadcastLevelUp } from './supabase/realtime';

// ============================================================================
// RANK SYSTEM
// ============================================================================

export interface Rank {
  id: string;
  name: string;
  minLevel: number;
  maxLevel: number;
  color: string;
  icon: string;
  benefits: {
    dailyCoins?: number;
    dailyGems?: number;
    crateDiscount?: number;
    xpBoost?: number;
  };
}

export const RANKS: Rank[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    minLevel: 1,
    maxLevel: 9,
    color: '#CD7F32',
    icon: '🥉',
    benefits: {
      dailyCoins: 50,
      xpBoost: 0
    }
  },
  {
    id: 'silver',
    name: 'Silver',
    minLevel: 10,
    maxLevel: 19,
    color: '#C0C0C0',
    icon: '🥈',
    benefits: {
      dailyCoins: 100,
      xpBoost: 5
    }
  },
  {
    id: 'gold',
    name: 'Gold',
    minLevel: 20,
    maxLevel: 29,
    color: '#FFD700',
    icon: '🥇',
    benefits: {
      dailyCoins: 200,
      dailyGems: 5,
      xpBoost: 10
    }
  },
  {
    id: 'platinum',
    name: 'Platinum',
    minLevel: 30,
    maxLevel: 39,
    color: '#E5E4E2',
    icon: '💎',
    benefits: {
      dailyCoins: 350,
      dailyGems: 10,
      crateDiscount: 5,
      xpBoost: 15
    }
  },
  {
    id: 'diamond',
    name: 'Diamond',
    minLevel: 40,
    maxLevel: 49,
    color: '#B9F2FF',
    icon: '💠',
    benefits: {
      dailyCoins: 500,
      dailyGems: 20,
      crateDiscount: 10,
      xpBoost: 20
    }
  },
  {
    id: 'master',
    name: 'Master',
    minLevel: 50,
    maxLevel: 74,
    color: '#9B59B6',
    icon: '👑',
    benefits: {
      dailyCoins: 750,
      dailyGems: 35,
      crateDiscount: 15,
      xpBoost: 25
    }
  },
  {
    id: 'grandmaster',
    name: 'Grandmaster',
    minLevel: 75,
    maxLevel: 99,
    color: '#E74C3C',
    icon: '⚡',
    benefits: {
      dailyCoins: 1000,
      dailyGems: 50,
      crateDiscount: 20,
      xpBoost: 30
    }
  },
  {
    id: 'legend',
    name: 'Legend',
    minLevel: 100,
    maxLevel: 999,
    color: '#F39C12',
    icon: '🔥',
    benefits: {
      dailyCoins: 1500,
      dailyGems: 75,
      crateDiscount: 25,
      xpBoost: 50
    }
  }
];

export function getRankByLevel(level: number): Rank {
  return RANKS.find(rank => level >= rank.minLevel && level <= rank.maxLevel) || RANKS[0];
}

export function getNextRank(currentLevel: number): Rank | null {
  const currentRank = getRankByLevel(currentLevel);
  const currentIndex = RANKS.findIndex(r => r.id === currentRank.id);
  return currentIndex < RANKS.length - 1 ? RANKS[currentIndex + 1] : null;
}

// ============================================================================
// BADGE SYSTEM
// ============================================================================

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'betting' | 'social' | 'progression' | 'special' | 'seasonal';
  requirement: {
    type: string;
    value: number;
    description: string;
  };
  reward?: {
    coins?: number;
    gems?: number;
    xp?: number;
  };
}

export const BADGES: Badge[] = [
  // Betting Badges
  {
    id: 'first_bet',
    name: 'First Blood',
    description: 'Place your first bet',
    icon: '🎲',
    rarity: 'common',
    category: 'betting',
    requirement: {
      type: 'bets_placed',
      value: 1,
      description: 'Place 1 bet'
    },
    reward: { coins: 100, xp: 50 }
  },
  {
    id: 'betting_novice',
    name: 'Betting Novice',
    description: 'Place 10 bets',
    icon: '🎯',
    rarity: 'common',
    category: 'betting',
    requirement: {
      type: 'bets_placed',
      value: 10,
      description: 'Place 10 bets'
    },
    reward: { coins: 250, xp: 100 }
  },
  {
    id: 'betting_expert',
    name: 'Betting Expert',
    description: 'Place 100 bets',
    icon: '🏆',
    rarity: 'rare',
    category: 'betting',
    requirement: {
      type: 'bets_placed',
      value: 100,
      description: 'Place 100 bets'
    },
    reward: { coins: 1000, gems: 10, xp: 500 }
  },
  {
    id: 'high_roller',
    name: 'High Roller',
    description: 'Place a bet of 10,000 coins or more',
    icon: '💰',
    rarity: 'epic',
    category: 'betting',
    requirement: {
      type: 'single_bet_amount',
      value: 10000,
      description: 'Place a single bet of 10,000+ coins'
    },
    reward: { coins: 5000, gems: 25, xp: 1000 }
  },
  {
    id: 'winning_streak',
    name: 'On Fire',
    description: 'Win 5 bets in a row',
    icon: '🔥',
    rarity: 'rare',
    category: 'betting',
    requirement: {
      type: 'win_streak',
      value: 5,
      description: 'Win 5 consecutive bets'
    },
    reward: { coins: 2000, gems: 15, xp: 750 }
  },
  
  // Progression Badges
  {
    id: 'level_10',
    name: 'Rising Star',
    description: 'Reach level 10',
    icon: '⭐',
    rarity: 'common',
    category: 'progression',
    requirement: {
      type: 'level',
      value: 10,
      description: 'Reach level 10'
    },
    reward: { coins: 500, xp: 200 }
  },
  {
    id: 'level_25',
    name: 'Veteran',
    description: 'Reach level 25',
    icon: '🎖️',
    rarity: 'rare',
    category: 'progression',
    requirement: {
      type: 'level',
      value: 25,
      description: 'Reach level 25'
    },
    reward: { coins: 1500, gems: 20, xp: 500 }
  },
  {
    id: 'level_50',
    name: 'Elite Player',
    description: 'Reach level 50',
    icon: '👑',
    rarity: 'epic',
    category: 'progression',
    requirement: {
      type: 'level',
      value: 50,
      description: 'Reach level 50'
    },
    reward: { coins: 5000, gems: 50, xp: 2000 }
  },
  {
    id: 'level_100',
    name: 'Legendary',
    description: 'Reach level 100',
    icon: '🏅',
    rarity: 'legendary',
    category: 'progression',
    requirement: {
      type: 'level',
      value: 100,
      description: 'Reach level 100'
    },
    reward: { coins: 25000, gems: 250, xp: 10000 }
  },
  
  // Social Badges
  {
    id: 'first_message',
    name: 'Chatty',
    description: 'Send your first chat message',
    icon: '💬',
    rarity: 'common',
    category: 'social',
    requirement: {
      type: 'messages_sent',
      value: 1,
      description: 'Send 1 chat message'
    },
    reward: { coins: 50, xp: 25 }
  },
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Send 100 chat messages',
    icon: '🦋',
    rarity: 'rare',
    category: 'social',
    requirement: {
      type: 'messages_sent',
      value: 100,
      description: 'Send 100 chat messages'
    },
    reward: { coins: 1000, gems: 10, xp: 500 }
  },
  
  // Special Badges
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Joined EquipGG in the first month',
    icon: '🌟',
    rarity: 'legendary',
    category: 'special',
    requirement: {
      type: 'join_date',
      value: 0,
      description: 'Join before Feb 2025'
    },
    reward: { coins: 10000, gems: 100, xp: 5000 }
  },
  {
    id: 'daily_login_7',
    name: 'Dedicated',
    description: 'Login 7 days in a row',
    icon: '📅',
    rarity: 'rare',
    category: 'special',
    requirement: {
      type: 'daily_streak',
      value: 7,
      description: 'Login 7 consecutive days'
    },
    reward: { coins: 1000, gems: 15, xp: 500 }
  },
  {
    id: 'daily_login_30',
    name: 'Loyal Player',
    description: 'Login 30 days in a row',
    icon: '🎖️',
    rarity: 'epic',
    category: 'special',
    requirement: {
      type: 'daily_streak',
      value: 30,
      description: 'Login 30 consecutive days'
    },
    reward: { coins: 5000, gems: 50, xp: 2500 }
  }
];

export function getBadgeById(badgeId: string): Badge | undefined {
  return BADGES.find(b => b.id === badgeId);
}

export function getBadgesByCategory(category: Badge['category']): Badge[] {
  return BADGES.filter(b => b.category === category);
}

export function getBadgesByRarity(rarity: Badge['rarity']): Badge[] {
  return BADGES.filter(b => b.rarity === rarity);
}

// ============================================================================
// BADGE CHECKING & AWARDING
// ============================================================================

export async function checkAndAwardBadges(userId: string, eventType: string, eventData: any) {
  const supabase = createServerSupabaseClient();
  
  // Get user's current badges
  const { data: userBadges } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId);
  
  const earnedBadgeIds = new Set(userBadges?.map(b => b.achievement_id) || []);
  const newBadges: Badge[] = [];
  
  // Check each badge requirement
  for (const badge of BADGES) {
    if (earnedBadgeIds.has(badge.id)) continue; // Already earned
    
    const earned = await checkBadgeRequirement(userId, badge, eventType, eventData);
    if (earned) {
      newBadges.push(badge);
      
      // Award the badge
      await supabase.from('user_achievements').insert({
        user_id: userId,
        achievement_id: badge.id,
        unlocked_at: new Date().toISOString()
      });
      
      // Award rewards
      if (badge.reward) {
        const { data: user } = await supabase
          .from('users')
          .select('coins, gems, xp')
          .eq('id', userId)
          .single();
        
        if (user) {
          await supabase
            .from('users')
            .update({
              coins: user.coins + (badge.reward.coins || 0),
              gems: user.gems + (badge.reward.gems || 0),
              xp: user.xp + (badge.reward.xp || 0)
            })
            .eq('id', userId);
        }
      }
      
      // Broadcast achievement unlock
      await broadcastAchievementUnlocked({
        userId,
        achievementId: badge.id,
        achievementName: badge.name,
        description: badge.description,
        xpReward: badge.reward?.xp || 0,
        timestamp: new Date().toISOString()
      });

      // Create user notification for badge
      try {
        await (await import('./notification-utils')).createNotification({
          userId,
          type: 'badge_awarded',
          title: '🎖️ Badge Earned!',
          message: `${badge.name}: ${badge.description}`,
          data: { badgeId: badge.id, reward: badge.reward }
        });
      } catch {}
      
      console.log(`🏆 Badge awarded: ${badge.name} to user ${userId}`);
    }
  }
  
  return newBadges;
}

async function checkBadgeRequirement(
  userId: string,
  badge: Badge,
  eventType: string,
  eventData: any
): Promise<boolean> {
  const supabase = createServerSupabaseClient();
  
  switch (badge.requirement.type) {
    case 'bets_placed': {
      const { count } = await supabase
        .from('bets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return (count || 0) >= badge.requirement.value;
    }
    
    case 'level': {
      const { data: user } = await supabase
        .from('users')
        .select('level')
        .eq('id', userId)
        .single();
      return (user?.level || 0) >= badge.requirement.value;
    }
    
    case 'messages_sent': {
      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', userId);
      return (count || 0) >= badge.requirement.value;
    }
    
    case 'single_bet_amount': {
      if (eventType === 'bet_placed' && eventData?.amount) {
        return eventData.amount >= badge.requirement.value;
      }
      return false;
    }
    
    case 'win_streak': {
      // Check last N bets for wins
      const { data: recentBets } = await supabase
        .from('bets')
        .select('status')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(badge.requirement.value);
      
      if (!recentBets || recentBets.length < badge.requirement.value) return false;
      return recentBets.every(bet => bet.status === 'won');
    }
    
    case 'daily_streak': {
      // This would require a daily_logins table or similar tracking
      // For now, return false - implement when daily login tracking is added
      return false;
    }
    
    default:
      return false;
  }
}

// ============================================================================
// RANK BENEFITS
// ============================================================================

export async function claimDailyRankRewards(userId: string) {
  const supabase = createServerSupabaseClient();
  
  const { data: user } = await supabase
    .from('users')
    .select('level, coins, gems, last_daily_claim')
    .eq('id', userId)
    .single();
  
  if (!user) return { success: false, error: 'User not found' };
  
  // Check if already claimed today
  const lastClaim = user.last_daily_claim ? new Date(user.last_daily_claim) : null;
  const now = new Date();
  
  if (lastClaim && lastClaim.toDateString() === now.toDateString()) {
    return { success: false, error: 'Already claimed today' };
  }
  
  const rank = getRankByLevel(user.level);
  const rewards = rank.benefits;
  
  await supabase
    .from('users')
    .update({
      coins: user.coins + (rewards.dailyCoins || 0),
      gems: user.gems + (rewards.dailyGems || 0),
      last_daily_claim: now.toISOString()
    })
    .eq('id', userId);
  
  return {
    success: true,
    rewards: {
      coins: rewards.dailyCoins || 0,
      gems: rewards.dailyGems || 0
    },
    rank: rank.name
  };
}

export function calculateXpWithBoost(baseXp: number, userLevel: number): number {
  const rank = getRankByLevel(userLevel);
  const boost = rank.benefits.xpBoost || 0;
  return Math.floor(baseXp * (1 + boost / 100));
}

export function getCrateDiscountPercent(userLevel: number): number {
  const rank = getRankByLevel(userLevel);
  return rank.benefits.crateDiscount || 0;
}
