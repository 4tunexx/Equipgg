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
import { supabase as clientSupabase } from './supabase/client';

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
 * Set mission progress to an absolute value for all missions of a requirement type.
 * Useful for counters like reach_level, own_items, etc.
 */
export async function setMissionProgress(
  userId: string,
  actionType: string,
  absoluteValue: number
) {
  const supabase = createServerSupabaseClient();
  const { data: missions } = await supabase
    .from('missions')
    .select('*')
    .eq('requirement_type', actionType);

  if (!missions || missions.length === 0) return;

  for (const mission of missions) {
    await updateMissionProgress(userId, mission.id, absoluteValue);
  }
}

/**
 * Recalculate ownership-based missions from inventory.
 */
export async function updateOwnershipMissions(userId: string) {
  const supabase = createServerSupabaseClient();
  const { data: inventory } = await supabase
    .from('user_inventory')
    .select('quantity, item:items(rarity)')
    .eq('user_id', userId);

  if (!inventory) return;

  let total = 0;
  let rare = 0, epic = 0, legendary = 0;

  for (const row of inventory as any[]) {
    const qty = (row.quantity ?? 1) as number;
    total += qty;
    const rarity = String(row.item?.rarity || '').toLowerCase();
    if (rarity === 'rare') rare += qty;
    if (rarity === 'epic') epic += qty;
    if (rarity === 'legendary') legendary += qty;
  }

  try { await setMissionProgress(userId, 'own_items', total); } catch {}
  try { await setMissionProgress(userId, 'inventory_slots', (inventory as any[]).length); } catch {}
  try { await setMissionProgress(userId, 'own_rare_item', rare); } catch {}
  try { await setMissionProgress(userId, 'own_epic_item', epic); } catch {}
  try { await setMissionProgress(userId, 'own_legendary_items', legendary); } catch {}
}

/** Check if all daily missions are completed and track aggregate mission */
async function checkAndTrackDailyCompletion(userId: string) {
  const supabase = createServerSupabaseClient();

  const { data: dailies } = await supabase
    .from('missions')
    .select('id')
    .eq('mission_type', 'daily')
    .eq('is_active', true);

  if (!dailies || dailies.length === 0) return;

  const ids = dailies.map((m: any) => m.id);
  const { data: progresses } = await supabase
    .from('user_mission_progress')
    .select('mission_id, completed')
    .eq('user_id', userId)
    .in('mission_id', ids);

  const allDone = ids.every(id => progresses?.some(p => p.mission_id === id && p.completed));
  if (!allDone) return;

  // Avoid spamming: only if there is an incomplete aggregate mission
  const { data: aggregateMissions } = await supabase
    .from('missions')
    .select('id')
    .eq('requirement_type', 'complete_daily_missions');

  if (!aggregateMissions || aggregateMissions.length === 0) return;

  // Check if already completed
  const { data: existing } = await supabase
    .from('user_mission_progress')
    .select('completed')
    .eq('user_id', userId)
    .in('mission_id', aggregateMissions.map((m:any)=>m.id));

  const already = existing?.some(e => e.completed);
  if (already) return;

  await trackMissionProgress(userId, 'complete_daily_missions', 1);
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
    .from('user_mission_progress')
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
      .from('user_mission_progress')
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
      .from('user_mission_progress')
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
    const mType = (mission as any).mission_type || (mission as any).type || 'general';
    await addXp(userId, mission.xp_reward, `mission_${mType}`, { missionId: mission.id });
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

  // If a daily mission was completed, check if all daily missions are done
  try {
    if ((mission as any).mission_type === 'daily') {
      await checkAndTrackDailyCompletion(userId);
    }
  } catch (e) {
    console.warn('Failed to check daily completion:', e);
  }
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
  console.log(`\n🎯🎯🎯 MISSION TRACKING START 🎯🎯🎯`);
  console.log(`👤 User: ${userId}`);
  console.log(`🎬 Action: ${actionType}`);
  console.log(`📊 Value: ${value}`);
  
  const supabase = createServerSupabaseClient();
  
  // Get all missions that match this action type
  console.log(`🔍 Searching for missions with requirement_type = '${actionType}'...`);
  const { data: missions, error: missionError } = await supabase
    .from('missions')
    .select('*')
    .eq('requirement_type', actionType);
  
  if (missionError) {
    console.error('❌ Error fetching missions:', missionError);
    return;
  }
  
  console.log(`📋 Found ${missions?.length || 0} matching missions`);
  
  if (!missions || missions.length === 0) {
    console.warn(`⚠️ No missions found with requirement_type '${actionType}'`);
    console.log(`💡 Available requirement types might be different. Check database!`);
    return;
  }
  
  console.log(`📝 Missions to update:`, missions.map(m => ({ id: m.id, name: m.name, requirement: m.requirement_value })));
  
  // Update progress for each matching mission
  for (const mission of missions) {
    console.log(`\n  📌 Updating mission: ${mission.name} (ID: ${mission.id})`);
    
    const existing = await getUserMissionProgress(userId, mission.id);
    const currentProgress = existing?.progress || 0;
    const newProgress = currentProgress + value;
    
    console.log(`    Current: ${currentProgress}/${mission.requirement_value}`);
    console.log(`    New: ${newProgress}/${mission.requirement_value}`);
    
    await updateMissionProgress(userId, mission.id, newProgress);
    
    if (newProgress >= mission.requirement_value) {
      console.log(`    ✅ MISSION COMPLETE!`);
    } else {
      console.log(`    ⏳ In progress (${Math.round((newProgress/mission.requirement_value) * 100)}%)`);
    }
  }
  
  console.log(`🎯🎯🎯 MISSION TRACKING END 🎯🎯🎯\n`);
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
        .from('user_mission_progress')
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
        .from('user_mission_progress')
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
