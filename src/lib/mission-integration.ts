/**
 * Mission Integration System
 * 
 * This integrates with the EXISTING 61 missions in Supabase
 * Fetches missions from database and tracks progress
 */

import { createServerSupabaseClient } from './supabase';
import { broadcastMissionCompleted } from './supabase/realtime';
import { addXp } from './xp-leveling-system';
import { createNotification } from './notification-utils';

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

/**
 * Get all missions from Supabase
 */
export async function getAllMissions(): Promise<Mission[]> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .order('id');
  
  if (error) {
    console.error('Failed to fetch missions:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get missions by type (daily, weekly, etc.)
 */
export async function getMissionsByType(type: string): Promise<Mission[]> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .eq('type', type)
    .order('id');
  
  if (error) {
    console.error('Failed to fetch missions by type:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get user's mission progress
 */
export async function getUserMissionProgress(userId: string, missionId: string) {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('user_missions')
    .select('*')
    .eq('user_id', userId)
    .eq('mission_id', missionId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Failed to fetch mission progress:', error);
    return null;
  }
  
  return data;
}

/**
 * Update mission progress
 */
export async function updateMissionProgress(
  userId: string,
  missionId: string,
  progress: number
): Promise<boolean> {
  const supabase = createServerSupabaseClient();
  
  const { data: mission } = await supabase
    .from('missions')
    .select('*')
    .eq('id', missionId)
    .single();
  
  if (!mission) return false;
  
  // Check if mission already exists for user
  const existing = await getUserMissionProgress(userId, missionId);
  
  if (existing) {
    // Update progress
    await supabase
      .from('user_missions')
      .update({
        progress,
        completed: progress >= mission.requirement_value,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('mission_id', missionId);
  } else {
    // Create new progress entry
    await supabase
      .from('user_missions')
      .insert({
        user_id: userId,
        mission_id: missionId,
        progress,
        completed: progress >= mission.requirement_value,
        created_at: new Date().toISOString()
      });
  }
  
  // Check if mission is now complete
  if (progress >= mission.requirement_value && (!existing || !existing.completed)) {
    await completeMission(userId, mission);
  }
  
  return true;
}

/**
 * Complete a mission and award rewards
 */
async function completeMission(userId: string, mission: Mission) {
  const supabase = createServerSupabaseClient();
  
  // Award XP
  if (mission.xp_reward) {
    await addXp(userId, mission.xp_reward, `mission_${mission.type}`, { missionId: mission.id });
  }
  
  // Award coins/gems
  if (mission.coin_reward || mission.gem_reward) {
    const { data: user } = await supabase
      .from('users')
      .select('coins, gems')
      .eq('id', userId)
      .single();
    
    if (user) {
      await supabase
        .from('users')
        .update({
          coins: user.coins + (mission.coin_reward || 0),
          gems: user.gems + (mission.gem_reward || 0)
        })
        .eq('id', userId);
    }
  }
  
  // Broadcast mission completion
  await broadcastMissionCompleted({
    userId,
    missionId: mission.id,
    missionName: mission.name,
    xpReward: mission.xp_reward || 0,
    coinReward: mission.coin_reward,
    timestamp: new Date().toISOString()
  });
  
  // Create notification for mission completion
  await createNotification({
    userId,
    type: 'mission_completed',
    title: '✅ Mission Complete!',
    message: `${mission.name} completed! +${mission.xp_reward} XP${mission.coin_reward ? ` and ${mission.coin_reward} coins` : ''}`,
    data: {
      missionId: mission.id,
      amount: mission.xp_reward
    }
  });
  
  console.log(`✅ Mission completed: ${mission.name} for user ${userId}`);
}

/**
 * Track mission progress for an action
 * Call this after actions like: bet placed, bet won, login, etc.
 */
export async function trackMissionProgress(
  userId: string,
  actionType: string,
  value: number = 1
) {
  const supabase = createServerSupabaseClient();
  
  // Get all missions that match this action type
  const { data: missions } = await supabase
    .from('missions')
    .select('*')
    .eq('requirement_type', actionType);
  
  if (!missions || missions.length === 0) return;
  
  // Update progress for each matching mission
  for (const mission of missions) {
    const existing = await getUserMissionProgress(userId, mission.id);
    const currentProgress = existing?.progress || 0;
    const newProgress = currentProgress + value;
    
    await updateMissionProgress(userId, mission.id, newProgress);
  }
}

/**
 * Reset daily missions for a user
 */
export async function resetDailyMissions(userId: string) {
  const supabase = createServerSupabaseClient();
  
  const dailyMissions = await getMissionsByType('daily');
  
  for (const mission of dailyMissions) {
    if (mission.repeatable) {
      await supabase
        .from('user_missions')
        .update({
          progress: 0,
          completed: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('mission_id', mission.id);
    }
  }
  
  console.log(`🔄 Reset daily missions for user ${userId}`);
}

/**
 * Reset weekly missions for a user
 */
export async function resetWeeklyMissions(userId: string) {
  const supabase = createServerSupabaseClient();
  
  const weeklyMissions = await getMissionsByType('weekly');
  
  for (const mission of weeklyMissions) {
    if (mission.repeatable) {
      await supabase
        .from('user_missions')
        .update({
          progress: 0,
          completed: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('mission_id', mission.id);
    }
  }
  
  console.log(`🔄 Reset weekly missions for user ${userId}`);
}
