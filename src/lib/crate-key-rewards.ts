/**
 * Crate Key Reward System
 * 
 * This module handles automatic crate key distribution based on user actions
 * such as leveling up, completing missions, daily login streaks, etc.
 */

import { createServerSupabaseClient } from './supabase';
import { createNotification } from './notification-utils';

/**
 * Award crate keys to a user
 */
export async function awardCrateKeys(userId: string, crateId: number, keysCount: number): Promise<void> {
  try {
    const supabaseAdmin = createServerSupabaseClient();
    const { error } = await supabaseAdmin.rpc('add_crate_keys', {
      p_user_id: userId,
      p_crate_id: crateId,
      p_keys_count: keysCount
    });

    if (error) {
      console.warn('add_crate_keys RPC missing or failed; falling back to user_keys upsert:', error);
      // Fallback to user_keys table
      const { data: existing } = await supabaseAdmin
        .from('user_keys')
        .select('id, keys_count')
        .eq('user_id', userId)
        .eq('crate_id', crateId)
        .maybeSingle();

      if (existing) {
        await supabaseAdmin
          .from('user_keys')
          .update({ keys_count: (existing as any).keys_count + keysCount })
          .eq('id', (existing as any).id);
      } else {
        await supabaseAdmin
          .from('user_keys')
          .insert({ user_id: userId, crate_id: crateId, keys_count: keysCount, acquired_at: new Date().toISOString() });
      }
    }

    // Notify user with deep-link to crates
    try {
      await createNotification({
        userId,
        type: 'reward',
        title: '🗝️ Crate Key Awarded',
        message: `You received ${keysCount} key${keysCount > 1 ? 's' : ''}!`,
        data: { linkTo: '/dashboard/crates', crateId, keysCount }
      });
    } catch {}

    console.log(`✅ Awarded ${keysCount} keys for crate ${crateId} to user ${userId}`);
  } catch (error) {
    console.error('Failed to award crate keys:', error);
    throw error;
  }
}

/**
 * Award Level Up Crate key when user levels up
 */
export async function awardLevelUpCrateKey(userId: string, newLevel: number): Promise<void> {
  try {
    // Award 1 Level Up Crate key every level (crate_id = 1)
    await awardCrateKeys(userId, 1, 1);

    // Award bonus keys at milestone levels
    if (newLevel % 10 === 0) {
      // Every 10 levels, award an additional key
      await awardCrateKeys(userId, 1, 1);
      console.log(`🎉 Milestone level ${newLevel}! Awarded bonus Level Up Crate key`);
    }

    if (newLevel % 25 === 0) {
      // Every 25 levels, award a Prestige Crate key (crate_id = 3)
      await awardCrateKeys(userId, 3, 1);
      console.log(`🏆 Milestone level ${newLevel}! Awarded Prestige Crate key`);
    }
  } catch (error) {
    console.error('Error awarding level up crate key:', error);
  }
}

/**
 * Award Weekly Loyalty Crate key for consistent logins
 */
export async function awardWeeklyLoyaltyCrateKey(userId: string, weekStreak: number): Promise<void> {
  try {
    // Award 1 Weekly Loyalty Crate key per week (crate_id = 2)
    await awardCrateKeys(userId, 2, 1);

    // Award bonus keys for long streaks
    if (weekStreak % 4 === 0) {
      // Every 4 weeks (1 month), award an extra key
      await awardCrateKeys(userId, 2, 1);
      console.log(`🔥 ${weekStreak} week streak! Awarded bonus Weekly Loyalty Crate key`);
    }
  } catch (error) {
    console.error('Error awarding loyalty crate key:', error);
  }
}

/**
 * Award Prestige Crate key when user reaches prestige
 */
export async function awardPrestigeCrateKey(userId: string, prestigeLevel: number): Promise<void> {
  try {
    // Award Prestige Crate keys based on prestige level (crate_id = 3)
    const keysToAward = Math.min(prestigeLevel, 3); // Award 1-3 keys based on prestige level
    await awardCrateKeys(userId, 3, keysToAward);
    
    console.log(`⭐ Prestige ${prestigeLevel} achieved! Awarded ${keysToAward} Prestige Crate keys`);
  } catch (error) {
    console.error('Error awarding prestige crate key:', error);
  }
}

/**
 * Award Reward Crate key for completing missions/achievements
 */
export async function awardRewardCrateKey(userId: string, missionType: 'daily' | 'weekly' | 'special'): Promise<void> {
  try {
    let keysToAward = 1;
    
    switch (missionType) {
      case 'daily':
        keysToAward = 1;
        break;
      case 'weekly':
        keysToAward = 2;
        break;
      case 'special':
        keysToAward = 3;
        break;
    }
    
    await awardCrateKeys(userId, 4, keysToAward);
    console.log(`🎯 ${missionType} mission completed! Awarded ${keysToAward} Reward Crate keys`);
  } catch (error) {
    console.error('Error awarding reward crate key:', error);
  }
}

/**
 * Award Event Crate key during special events
 */
export async function awardEventCrateKey(userId: string, eventName: string): Promise<void> {
  try {
    await awardCrateKeys(userId, 5, 1);
    console.log(`🎊 Event "${eventName}" participation! Awarded Event Crate key`);
  } catch (error) {
    console.error('Error awarding event crate key:', error);
  }
}

/**
 * Check and award daily login crate keys
 */
export async function checkDailyLoginRewards(userId: string): Promise<void> {
  try {
    const supabaseAdmin = createServerSupabaseClient();
    // Check user's login streak
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('last_login_date, login_streak')
      .eq('id', userId)
      .single();

    if (!userData) return;

    const today = new Date().toDateString();
    const lastLogin = userData.last_login_date ? new Date(userData.last_login_date).toDateString() : null;

    // If user logged in yesterday, increment streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const wasYesterday = lastLogin === yesterday.toDateString();
    
    if (wasYesterday) {
      const newStreak = (userData.login_streak || 0) + 1;
      
      // Update streak
      await supabaseAdmin
        .from('users')
        .update({
          last_login_date: new Date().toISOString(),
          login_streak: newStreak
        })
        .eq('id', userId);

      // Award weekly loyalty crate every 7 days
      if (newStreak % 7 === 0) {
        await awardWeeklyLoyaltyCrateKey(userId, Math.floor(newStreak / 7));
      }
    } else if (lastLogin !== today) {
      // Reset streak if not consecutive
      await supabaseAdmin
        .from('users')
        .update({
          last_login_date: new Date().toISOString(),
          login_streak: 1
        })
        .eq('id', userId);
    }
  } catch (error) {
    console.error('Error checking daily login rewards:', error);
  }
}
