/**
 * Activity Tracker - Records user actions for Recent Activity panel
 * Tracks all user actions to display in dashboard
 */

import { createServerSupabaseClient } from './supabase';

export interface ActivityData {
  userId: string;
  activityType: 'bet_placed' | 'bet_won' | 'bet_lost' | 'crate_opened' | 'item_received' | 'trade_completed' | 'item_sold' | 'item_bought' | 'item_equipped' | 'level_up' | 'mission_completed' | 'achievement_unlocked' | 'login';
  description: string;
  data?: Record<string, any>;
}

/**
 * Create a new activity entry for a user
 */
export async function createActivity(activity: ActivityData): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient();
    
    console.log(`📝 Creating activity: ${activity.activityType} for user ${activity.userId}`);
    
    const { error } = await supabase
      .from('user_activities')
      .insert({
        user_id: activity.userId,
        activity_type: activity.activityType,
        description: activity.description,
        data: activity.data || {},
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Failed to create activity:', error);
      return false;
    }
    
    console.log(`✅ Activity created: ${activity.activityType}`);
    return true;
  } catch (error) {
    console.error('Activity tracker error:', error);
    return false;
  }
}

/**
 * Get recent activities for a user
 */
export async function getUserActivities(userId: string, limit: number = 20) {
  try {
    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Failed to fetch activities:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Get activities error:', error);
    return [];
  }
}

/**
 * Helper functions for common activity types
 */

export async function trackBetPlaced(userId: string, matchName: string, amount: number, team: string) {
  return createActivity({
    userId,
    activityType: 'bet_placed',
    description: `Placed ${amount} coins bet on ${team} in ${matchName}`,
    data: { matchName, amount, team }
  });
}

export async function trackBetWon(userId: string, matchName: string, amount: number, payout: number) {
  return createActivity({
    userId,
    activityType: 'bet_won',
    description: `Won ${payout} coins from bet on ${matchName}`,
    data: { matchName, amount, payout }
  });
}

export async function trackBetLost(userId: string, matchName: string, amount: number) {
  return createActivity({
    userId,
    activityType: 'bet_lost',
    description: `Lost ${amount} coins bet on ${matchName}`,
    data: { matchName, amount }
  });
}

export async function trackCrateOpened(userId: string, crateName: string, itemWon: string, rarity: string) {
  return createActivity({
    userId,
    activityType: 'crate_opened',
    description: `Opened ${crateName} and won ${itemWon}`,
    data: { crateName, itemWon, rarity }
  });
}

export async function trackItemReceived(userId: string, itemName: string, source: string) {
  return createActivity({
    userId,
    activityType: 'item_received',
    description: `Received ${itemName} from ${source}`,
    data: { itemName, source }
  });
}

export async function trackTradeCompleted(userId: string, itemsGiven: string[], itemsReceived: string[]) {
  return createActivity({
    userId,
    activityType: 'trade_completed',
    description: `Completed trade: Gave ${itemsGiven.length} items, received ${itemsReceived.length} items`,
    data: { itemsGiven, itemsReceived }
  });
}

export async function trackItemSold(userId: string, itemName: string, price: number) {
  return createActivity({
    userId,
    activityType: 'item_sold',
    description: `Sold ${itemName} for ${price} coins`,
    data: { itemName, price }
  });
}

export async function trackItemBought(userId: string, itemName: string, price: number) {
  return createActivity({
    userId,
    activityType: 'item_bought',
    description: `Bought ${itemName} for ${price} coins`,
    data: { itemName, price }
  });
}

export async function trackItemEquipped(userId: string, itemName: string, slot: string) {
  return createActivity({
    userId,
    activityType: 'item_equipped',
    description: `Equipped ${itemName} to ${slot} slot`,
    data: { itemName, slot }
  });
}

export async function trackLevelUp(userId: string, newLevel: number) {
  return createActivity({
    userId,
    activityType: 'level_up',
    description: `Reached level ${newLevel}!`,
    data: { level: newLevel }
  });
}

export async function trackMissionCompleted(userId: string, missionName: string, reward: number) {
  return createActivity({
    userId,
    activityType: 'mission_completed',
    description: `Completed mission: ${missionName} (+${reward} XP)`,
    data: { missionName, reward }
  });
}

export async function trackAchievementUnlocked(userId: string, achievementName: string) {
  return createActivity({
    userId,
    activityType: 'achievement_unlocked',
    description: `Unlocked achievement: ${achievementName}`,
    data: { achievementName }
  });
}

export async function trackLogin(userId: string) {
  return createActivity({
    userId,
    activityType: 'login',
    description: 'Logged in',
    data: { timestamp: new Date().toISOString() }
  });
}
