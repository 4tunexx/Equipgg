import { getDb, run, getOne, getAll } from './db';

export interface MissionUpdate {
  userId: string;
  action: string;
  value?: number;
  metadata?: any;
}

export async function updateMissionProgress(update: MissionUpdate) {
  try {
    const db = await getDb();
    
    // Get all active missions that match this action
    const missions = await getAll(`
      SELECT id, requirement_type, requirement_value, xp_reward, coin_reward, gem_reward, crate_reward
      FROM missions 
      WHERE is_active = 1 AND requirement_type = ?
    `, [update.action]);

    for (const mission of missions) {
      // Get current progress
      const currentProgress = await getOne(
        'SELECT progress FROM user_mission_progress WHERE user_id = ? AND mission_id = ?',
        [update.userId, mission.id as string]
      );

      const currentValue = currentProgress?.progress || 0;
      let newValue = currentValue;

      // Update progress based on action type
      switch (update.action) {
        case 'login':
        case 'visit_shop':
        case 'visit_leaderboard':
        case 'cast_vote':
        case 'equip_item':
        case 'sell_item':
        case 'open_crate':
        case 'forum_post':
          // These are one-time actions
          newValue = 100;
          break;
        
        case 'place_bet':
        case 'win_bet':
        case 'send_messages':
        case 'earn_coins':
        case 'reach_level':
          // These are cumulative actions
          const increment = update.value || 1;
          newValue = Math.min((currentValue as number) + increment, mission.requirement_value as number);
          break;
        
        default:
          // Default to increment by 1
          newValue = Math.min((currentValue as number) + 1, mission.requirement_value as number);
      }

      // Calculate progress percentage
      const progressPercentage = Math.min((newValue / (mission.requirement_value as number)) * 100, 100);
      const isCompleted = progressPercentage >= 100;

      // Update or insert progress
      await run(
        `INSERT OR REPLACE INTO user_mission_progress 
         (user_id, mission_id, progress, completed, completed_at, last_updated) 
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [
          update.userId, 
          mission.id as string, 
          progressPercentage, 
          isCompleted ? 1 : 0,
          isCompleted ? new Date().toISOString() : null
        ]
      );

      // If mission was just completed, award rewards
      if (isCompleted && (currentValue as number) < 100) {
        await awardMissionRewards(update.userId, mission);
      }
    }

  } catch (error) {
    console.error('Error updating mission progress:', error);
  }
}

async function awardMissionRewards(userId: string, mission: any) {
  try {
    const db = await getDb();
    
    // Award XP
    if (mission.xp_reward > 0) {
      await run(
        'UPDATE users SET xp = xp + ? WHERE id = ?',
        [mission.xp_reward, userId]
      );
    }

    // Award coins
    if (mission.coin_reward > 0) {
      await run(
        'UPDATE users SET coins = coins + ? WHERE id = ?',
        [mission.coin_reward, userId]
      );
    }

    // Award gems
    if (mission.gem_reward > 0) {
      await run(
        'UPDATE users SET gems = gems + ? WHERE id = ?',
        [mission.gem_reward, userId]
      );
    }

    // Award crate (if specified)
    if (mission.crate_reward) {
      // Add crate to user's inventory
      const crateId = `crate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await run(
        `INSERT INTO user_crates (id, user_id, crate_id, crate_name, acquired_at)
         VALUES (?, ?, ?, ?, ?)`,
        [crateId, userId, mission.crate_reward.toLowerCase().replace(/\s+/g, '-'), mission.crate_reward, new Date().toISOString()]
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
        'mission_completed',
        mission.title || 'Mission',
        mission.xp_reward || 0,
        new Date().toISOString()
      ]
    );

    console.log(`✅ Mission completed: ${mission.title} for user ${userId}`);

  } catch (error) {
    console.error('Error awarding mission rewards:', error);
  }
}

// Helper functions for common actions
export async function trackLogin(userId: string) {
  await updateMissionProgress({ userId, action: 'login' });
}

export async function trackBetPlaced(userId: string, amount: number) {
  await updateMissionProgress({ userId, action: 'place_bet', value: 1 });
}

export async function trackBetWon(userId: string, winnings: number) {
  await updateMissionProgress({ userId, action: 'win_bet', value: 1 });
  await updateMissionProgress({ userId, action: 'earn_coins', value: winnings });
}

export async function trackShopVisit(userId: string) {
  await updateMissionProgress({ userId, action: 'visit_shop' });
}

export async function trackLeaderboardVisit(userId: string) {
  await updateMissionProgress({ userId, action: 'visit_leaderboard' });
}

export async function trackCrateOpened(userId: string) {
  await updateMissionProgress({ userId, action: 'open_crate' });
}

export async function trackItemEquipped(userId: string) {
  await updateMissionProgress({ userId, action: 'equip_item' });
}

export async function trackItemSold(userId: string) {
  await updateMissionProgress({ userId, action: 'sell_item' });
}

export async function trackMessageSent(userId: string) {
  await updateMissionProgress({ userId, action: 'send_messages', value: 1 });
}

export async function trackVoteCast(userId: string) {
  await updateMissionProgress({ userId, action: 'cast_vote' });
}

export async function trackLevelUp(userId: string, newLevel: number) {
  await updateMissionProgress({ userId, action: 'reach_level', value: newLevel });
}
