/**
 * Achievement Integration System
 * 
 * This integrates with the EXISTING 66 achievements in Supabase
 * Fetches achievements from database and checks/awards them
 */

import { createServerSupabaseClient } from './supabase';
import { broadcastAchievementUnlocked } from './supabase/realtime';
import { createNotification } from './notification-utils';

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

/**
 * Fetch all achievements from Supabase
 */
export async function getAllAchievements(): Promise<Achievement[]> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('id');
  
  if (error) {
    console.error('Failed to fetch achievements:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get achievements by category
 */
export async function getAchievementsByCategory(category: string): Promise<Achievement[]> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('category', category)
    .order('id');
  
  if (error) {
    console.error('Failed to fetch achievements by category:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get user's unlocked achievements
 */
export async function getUserAchievements(userId: string): Promise<string[]> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Failed to fetch user achievements:', error);
    return [];
  }
  
  return (data || []).map(ua => ua.achievement_id);
}

/**
 * Check if user meets achievement requirement
 */
async function checkAchievementRequirement(
  userId: string,
  achievement: Achievement
): Promise<boolean> {
  const supabase = createServerSupabaseClient();
  
  switch (achievement.requirement_type) {
    case 'bets_placed': {
      const { count } = await supabase
        .from('bets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return (count || 0) >= achievement.requirement_value;
    }
    
    case 'bets_won': {
      const { count } = await supabase
        .from('bets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'won');
      return (count || 0) >= achievement.requirement_value;
    }
    
    case 'win_streak': {
      // Get last N bets
      const { data: recentBets } = await supabase
        .from('bets')
        .select('status')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(achievement.requirement_value);
      
      if (!recentBets || recentBets.length < achievement.requirement_value) return false;
      return recentBets.every(bet => bet.status === 'won');
    }
    
    case 'high_odds_win': {
      const { count } = await supabase
        .from('bets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'won')
        .gte('odds', achievement.requirement_value);
      return (count || 0) > 0;
    }
    
    case 'single_bet_payout': {
      const { count } = await supabase
        .from('bets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'won')
        .gte('payout', achievement.requirement_value);
      return (count || 0) > 0;
    }
    
    case 'level': {
      const { data: user } = await supabase
        .from('users')
        .select('level')
        .eq('id', userId)
        .single();
      return (user?.level || 0) >= achievement.requirement_value;
    }
    
    case 'crates_opened': {
      // This would need a crate_openings table or count in inventory
      // For now, return false - implement when crate tracking is added
      return false;
    }
    
    case 'items_owned': {
      const { count } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return (count || 0) >= achievement.requirement_value;
    }
    
    default:
      console.warn(`Unknown requirement type: ${achievement.requirement_type}`);
      return false;
  }
}

/**
 * Check and award achievements for a user
 * Call this after significant actions (bet placed, bet won, level up, etc.)
 */
export async function checkAndAwardAchievements(
  userId: string,
  category?: string
): Promise<Achievement[]> {
  const supabase = createServerSupabaseClient();
  
  // Get all achievements (or filter by category)
  const achievements = category 
    ? await getAchievementsByCategory(category)
    : await getAllAchievements();
  
  // Get user's already unlocked achievements
  const unlockedIds = await getUserAchievements(userId);
  const unlockedSet = new Set(unlockedIds);
  
  const newlyUnlocked: Achievement[] = [];
  
  // Check each achievement
  for (const achievement of achievements) {
    if (unlockedSet.has(achievement.id)) continue; // Already unlocked
    
    const meetsRequirement = await checkAchievementRequirement(userId, achievement);
    
    if (meetsRequirement) {
      // Award the achievement
      await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
          unlocked_at: new Date().toISOString()
        });
      
      // Award rewards
      if (achievement.xp_reward || achievement.coin_reward || achievement.gem_reward) {
        const { data: user } = await supabase
          .from('users')
          .select('xp, coins, gems')
          .eq('id', userId)
          .single();
        
        if (user) {
          await supabase
            .from('users')
            .update({
              xp: user.xp + (achievement.xp_reward || 0),
              coins: user.coins + (achievement.coin_reward || 0),
              gems: user.gems + (achievement.gem_reward || 0)
            })
            .eq('id', userId);
        }
      }
      
      // Broadcast achievement unlock
      await broadcastAchievementUnlocked({
        userId,
        achievementId: achievement.id,
        achievementName: achievement.name,
        description: achievement.description,
        xpReward: achievement.xp_reward || 0,
        timestamp: new Date().toISOString()
      });
      
      // Create notification for achievement unlock
      await createNotification({
        userId,
        type: 'achievement',
        title: '🏆 Achievement Unlocked!',
        message: `${achievement.name}: ${achievement.description}`,
        data: {
          achievementId: achievement.id,
          amount: achievement.xp_reward
        }
      });
      
      newlyUnlocked.push(achievement);
      console.log(`🏆 Achievement unlocked: ${achievement.name} for user ${userId}`);
    }
  }
  
  return newlyUnlocked;
}

/**
 * Get achievement progress for a user
 */
export async function getAchievementProgress(
  userId: string,
  achievementId: string
): Promise<{ current: number; required: number; percentage: number }> {
  const supabase = createServerSupabaseClient();
  
  const { data: achievement } = await supabase
    .from('achievements')
    .select('*')
    .eq('id', achievementId)
    .single();
  
  if (!achievement) {
    return { current: 0, required: 0, percentage: 0 };
  }
  
  let current = 0;
  
  switch (achievement.requirement_type) {
    case 'bets_placed': {
      const { count } = await supabase
        .from('bets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      current = count || 0;
      break;
    }
    
    case 'bets_won': {
      const { count } = await supabase
        .from('bets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'won');
      current = count || 0;
      break;
    }
    
    case 'level': {
      const { data: user } = await supabase
        .from('users')
        .select('level')
        .eq('id', userId)
        .single();
      current = user?.level || 0;
      break;
    }
    
    // Add more cases as needed
  }
  
  const required = achievement.requirement_value;
  const percentage = Math.min((current / required) * 100, 100);
  
  return { current, required, percentage };
}
