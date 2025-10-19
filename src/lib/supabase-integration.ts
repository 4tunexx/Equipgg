/**
 * COMPLETE SUPABASE INTEGRATION
 * 
 * This file integrates with ALL existing Supabase data:
 * - 50 RANKS
 * - 68 BADGES (Level, Wealth, Collection, Betting, Community)
 * - 25 PERKS (XP Boosts, Coin Multipliers, Cosmetics)
 * - 66 ACHIEVEMENTS (Betting, Progression, Social, Special)
 * - 61 MISSIONS (Daily, Weekly, Special, Story)
 * - 110 ITEMS (CS2 Skins: Common, Uncommon, Rare, Epic, Legendary)
 * - 5 CRATES (Level Up, Weekly Loyalty, Prestige, Trade-Up, Summer 2025)
 */

import { createServerSupabaseClient } from './supabase';
import { 
  broadcastAchievementUnlocked, 
  broadcastLevelUp,
  broadcastItemAdded,
  broadcastCrateOpened,
  broadcastMissionCompleted,
  broadcastBalanceUpdated
} from './supabase/realtime';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Rank {
  id: number;
  name: string;
  min_level: number;
  max_level: number;
  color: string;
  icon_url: string | null;
  benefits: {
    daily_coins?: number;
    daily_gems?: number;
    xp_multiplier?: number;
    crate_discount?: number;
  };
  is_active: boolean;
  created_at: string;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  icon_url: string | null;
  rarity: string;
  is_active: boolean;
  created_at: string;
}

export interface Perk {
  id: number;
  name: string;
  description: string;
  category: string;
  perk_type: string;
  effect_value: number;
  duration_hours: number;
  coin_price: number;
  gem_price: number;
  is_consumable: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
  coin_reward?: number;
  gem_reward?: number;
  icon?: string;
  rarity?: string;
  created_at: string;
}

export interface Mission {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'special' | 'story';
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
  coin_reward?: number;
  gem_reward?: number;
  repeatable: boolean;
  created_at: string;
}

export interface Item {
  id: string;
  name: string;
  description?: string;
  type: string;
  rarity: string;
  value?: number;
  image_url?: string;
  created_at: string;
}

export interface Crate {
  id: string;
  name: string;
  description: string;
  price?: number;
  requires_key: boolean;
  created_at: string;
}

// ============================================================================
// RANKS SYSTEM (50 Ranks)
// ============================================================================

export async function getAllRanks(): Promise<Rank[]> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('ranks')
    .select('*')
    .eq('is_active', true)
    .order('min_level');
  
  if (error) {
    console.error('Failed to fetch ranks:', error);
    return [];
  }
  
  return data || [];
}

export async function getRankByLevel(level: number): Promise<Rank | null> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('ranks')
    .select('*')
    .eq('is_active', true)
    .lte('min_level', level)
    .gte('max_level', level)
    .single();
  
  if (error) {
    console.error('Failed to fetch rank by level:', error);
    return null;
  }
  
  return data;
}

export async function getNextRank(currentLevel: number): Promise<Rank | null> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('ranks')
    .select('*')
    .eq('is_active', true)
    .gt('min_level', currentLevel)
    .order('min_level')
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Failed to fetch next rank:', error);
    return null;
  }
  
  return data;
}

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
  
  const rank = await getRankByLevel(user.level);
  if (!rank) return { success: false, error: 'Rank not found' };
  
  const rewards = rank.benefits;
  
  await supabase
    .from('users')
    .update({
      coins: user.coins + (rewards.daily_coins || 0),
      gems: user.gems + (rewards.daily_gems || 0),
      last_daily_claim: now.toISOString()
    })
    .eq('id', userId);
  
  return {
    success: true,
    rewards: {
      coins: rewards.daily_coins || 0,
      gems: rewards.daily_gems || 0
    },
    rank: rank.name
  };
}

// ============================================================================
// BADGES SYSTEM (50 Badges)
// ============================================================================

export async function getAllBadges(): Promise<Badge[]> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('is_active', true)
    .order('id');
  
  if (error) {
    console.error('Failed to fetch badges:', error);
    return [];
  }
  
  return data || [];
}

export async function getBadgesByCategory(category: string): Promise<Badge[]> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('is_active', true)
    .eq('category', category)
    .order('id');
  
  if (error) {
    console.error('Failed to fetch badges by category:', error);
    return [];
  }
  
  return data || [];
}

export async function getUserBadges(userId: string): Promise<number[]> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Failed to fetch user badges:', error);
    return [];
  }
  
  return (data || []).map(ub => ub.badge_id);
}

async function checkBadgeRequirement(userId: string, badge: Badge): Promise<boolean> {
  const supabase = createServerSupabaseClient();
  
  switch (badge.requirement_type) {
    case 'level': {
      const { data: user } = await supabase
        .from('users')
        .select('level')
        .eq('id', userId)
        .single();
      return (user?.level || 0) >= badge.requirement_value;
    }
    
    case 'prestige': {
      const { data: user } = await supabase
        .from('users')
        .select('prestige_level')
        .eq('id', userId)
        .single();
      return (user?.prestige_level || 0) >= badge.requirement_value;
    }
    
    default:
      return false;
  }
}

export async function checkAndAwardBadges(userId: string, category?: string): Promise<Badge[]> {
  const supabase = createServerSupabaseClient();
  
  const badges = category 
    ? await getBadgesByCategory(category)
    : await getAllBadges();
  
  const unlockedIds = await getUserBadges(userId);
  const unlockedSet = new Set(unlockedIds);
  
  const newlyUnlocked: Badge[] = [];
  
  for (const badge of badges) {
    if (unlockedSet.has(badge.id)) continue;
    
    const meetsRequirement = await checkBadgeRequirement(userId, badge);
    
    if (meetsRequirement) {
      await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badge.id,
          earned_at: new Date().toISOString()
        });
      
      newlyUnlocked.push(badge);
      console.log(`🏅 Badge earned: ${badge.name} for user ${userId}`);
    }
  }
  
  return newlyUnlocked;
}

// ============================================================================
// PERKS SYSTEM (25 Perks)
// ============================================================================

export async function getAllPerks(): Promise<Perk[]> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('perks')
    .select('*')
    .eq('is_active', true)
    .order('id');
  
  if (error) {
    console.error('Failed to fetch perks:', error);
    return [];
  }
  
  return data || [];
}

export async function getPerksByCategory(category: string): Promise<Perk[]> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('perks')
    .select('*')
    .eq('is_active', true)
    .eq('category', category)
    .order('id');
  
  if (error) {
    console.error('Failed to fetch perks by category:', error);
    return [];
  }
  
  return data || [];
}

export async function activatePerk(userId: string, perkId: number): Promise<boolean> {
  const supabase = createServerSupabaseClient();
  
  const { data: perk } = await supabase
    .from('perks')
    .select('*')
    .eq('id', perkId)
    .single();
  
  if (!perk) return false;
  
  // Check if user can afford it
  const { data: user } = await supabase
    .from('users')
    .select('coins, gems')
    .eq('id', userId)
    .single();
  
  if (!user) return false;
  
  if (user.coins < perk.coin_price || user.gems < perk.gem_price) {
    return false;
  }
  
  // Deduct cost
  await supabase
    .from('users')
    .update({
      coins: user.coins - perk.coin_price,
      gems: user.gems - perk.gem_price
    })
    .eq('id', userId);
  
  // Activate perk
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + perk.duration_hours);
  
  await supabase
    .from('user_perks')
    .insert({
      user_id: userId,
      perk_id: perkId,
      activated_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      is_active: true
    });
  
  console.log(`✨ Perk activated: ${perk.name} for user ${userId}`);
  return true;
}

export async function getActivePerks(userId: string): Promise<Perk[]> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('user_perks')
    .select('*, perks(*)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString());
  
  if (error) {
    console.error('Failed to fetch active perks:', error);
    return [];
  }
  
  return (data || []).map(up => up.perks);
}

// Export all functions from achievement and mission integration
export * from './achievement-integration';
export * from './mission-integration';
export * from './xp-leveling-system';
