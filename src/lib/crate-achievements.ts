/**
 * Crate Opening Achievement Tracking
 * 
 * Tracks user progress towards crate-related achievements
 */

import { createServerSupabaseClient } from './supabase';
import { createNotification } from './notification-utils';

interface CrateAchievement {
  id: string;
  name: string;
  description: string;
  requirement: number;
  xpReward: number;
  coinReward: number;
}

const CRATE_ACHIEVEMENTS: CrateAchievement[] = [
  {
    id: 'crate_opener_1',
    name: 'First Unboxing',
    description: 'Open your first crate',
    requirement: 1,
    xpReward: 100,
    coinReward: 500
  },
  {
    id: 'crate_opener_10',
    name: 'Unboxing Enthusiast',
    description: 'Open 10 crates',
    requirement: 10,
    xpReward: 250,
    coinReward: 1000
  },
  {
    id: 'crate_opener_50',
    name: 'Crate Collector',
    description: 'Open 50 crates',
    requirement: 50,
    xpReward: 500,
    coinReward: 2500
  },
  {
    id: 'crate_opener_100',
    name: 'Master Unboxer',
    description: 'Open 100 crates',
    requirement: 100,
    xpReward: 1000,
    coinReward: 5000
  },
  {
    id: 'crate_opener_250',
    name: 'Legendary Unboxer',
    description: 'Open 250 crates',
    requirement: 250,
    xpReward: 2500,
    coinReward: 10000
  },
  {
    id: 'lucky_legendary',
    name: 'Lucky Legend',
    description: 'Unbox a Legendary item',
    requirement: 1,
    xpReward: 500,
    coinReward: 2000
  }
];

/**
 * Track crate opening and check for achievements
 */
export async function trackCrateOpening(
  userId: string,
  itemRarity: string
): Promise<void> {
  try {
    const supabaseAdmin = createServerSupabaseClient();
    // Get total crates opened by user
    const { count: totalOpened } = await supabaseAdmin
      .from('crate_opening_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const cratesOpened = totalOpened || 0;

    // Check for crate opening count achievements
    for (const achievement of CRATE_ACHIEVEMENTS) {
      if (achievement.id.startsWith('crate_opener_') && cratesOpened === achievement.requirement) {
        await awardAchievement(userId, achievement);
      }
    }

    // Check for legendary item achievement
    if (itemRarity.toLowerCase() === 'legendary') {
      const legendaryAchievement = CRATE_ACHIEVEMENTS.find(a => a.id === 'lucky_legendary');
      if (legendaryAchievement) {
        // Check if user already has this achievement
        const { data: existing } = await supabaseAdmin
          .from('user_achievements')
          .select('id')
          .eq('user_id', userId)
          .eq('achievement_id', legendaryAchievement.id)
          .maybeSingle();

        if (!existing) {
          await awardAchievement(userId, legendaryAchievement);
        }
      }
    }

  } catch (error) {
    console.error('Error tracking crate achievements:', error);
  }
}

/**
 * Award an achievement to a user
 */
async function awardAchievement(
  userId: string,
  achievement: CrateAchievement
): Promise<void> {
  try {
    const supabaseAdmin = createServerSupabaseClient();
    // Check if achievement already exists
    const { data: existing } = await supabaseAdmin
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_id', achievement.id)
      .maybeSingle();

    if (existing) {
      return; // Already has this achievement
    }

    // Create achievement record
    await supabaseAdmin
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_id: achievement.id,
        unlocked_at: new Date().toISOString(),
        progress: 100
      });

    // Award XP and coins
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('xp, coins')
      .eq('id', userId)
      .single();

    if (currentUser) {
      await supabaseAdmin
        .from('users')
        .update({
          xp: currentUser.xp + achievement.xpReward,
          coins: currentUser.coins + achievement.coinReward
        })
        .eq('id', userId);
    }

    // Create notification
    await createNotification({
      userId,
      type: 'achievement',
      title: '🏆 Achievement Unlocked!',
      message: `${achievement.name}: ${achievement.description}! Earned ${achievement.xpReward} XP and ${achievement.coinReward} coins!`,
      data: {
        achievementId: achievement.id,
        name: achievement.name,
        xpReward: achievement.xpReward,
        coinReward: achievement.coinReward
      }
    });

    // Log to activity feed
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('username')
      .eq('id', userId)
      .single();

    await supabaseAdmin
      .from('activity_feed')
      .insert({
        user_id: userId,
        action: 'unlocked_achievement',
        description: `${userData?.username || 'Player'} unlocked achievement: ${achievement.name}`,
        metadata: {
          achievementId: achievement.id,
          achievementName: achievement.name,
          xpReward: achievement.xpReward,
          coinReward: achievement.coinReward
        },
        created_at: new Date().toISOString()
      });

    console.log(`🏆 Achievement awarded: ${achievement.name} to user ${userId}`);
  } catch (error) {
    console.error('Error awarding achievement:', error);
  }
}

/**
 * Get user's crate opening statistics
 */
export async function getCrateStatistics(userId: string): Promise<{
  totalOpened: number;
  byRarity: Record<string, number>;
  byCrate: Record<string, number>;
  legendaryCount: number;
}> {
  try {
    const supabaseAdmin = createServerSupabaseClient();
    const { data: history } = await supabaseAdmin
      .from('crate_opening_history')
      .select('crate_id, item:items(rarity), crate:crates(name)')
      .eq('user_id', userId);

    const stats = {
      totalOpened: history?.length || 0,
      byRarity: {} as Record<string, number>,
      byCrate: {} as Record<string, number>,
      legendaryCount: 0
    };

    history?.forEach((entry: any) => {
      // Count by rarity
      const rarity = entry.item?.rarity || 'Unknown';
      stats.byRarity[rarity] = (stats.byRarity[rarity] || 0) + 1;

      if (rarity.toLowerCase() === 'legendary') {
        stats.legendaryCount++;
      }

      // Count by crate type
      const crateName = entry.crate?.name || 'Unknown';
      stats.byCrate[crateName] = (stats.byCrate[crateName] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Error getting crate statistics:', error);
    return {
      totalOpened: 0,
      byRarity: {},
      byCrate: {},
      legendaryCount: 0
    };
  }
}
