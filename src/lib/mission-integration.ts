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
    .select('quantity, item:items!fk_user_inventory_item_id(rarity)')
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
    // The missions table uses the column name `mission_type` for categorization.
    // Using `type` here was returning no rows in some environments.
    .eq('mission_type', type)
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
    // Update progress (note: user_mission_progress table doesn't have updated_at column)
    await supabase
      .from('user_mission_progress')
      .update({
        progress,
        completed: progress >= mission.requirement_value
      })
      .eq('user_id', userId)
      .eq('mission_id', missionId);
  } else {
    // Create new progress entry (note: started_at and created_at don't exist)
    await supabase
      .from('user_mission_progress')
      .insert({
        user_id: userId,
        mission_id: missionId,
        progress,
        completed: progress >= mission.requirement_value
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

  // Also check achievements that depend on mission completion
  try {
    const { achievementService } = await import('./achievement-service');
    await achievementService.checkAchievements(userId, 'mission_completed', undefined);
  } catch {}
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
 * This sets progress to 0 and marks as incomplete, and sets started_at to now
 */
export async function resetDailyMissions(userId: string) {
  const supabase = createServerSupabaseClient();
  
  const dailyMissions = await getMissionsByType('daily');
  const now = new Date().toISOString();
  
  for (const mission of dailyMissions) {
    // Check if progress entry exists (use maybeSingle to avoid error if not found)
    // Note: Only select columns that exist in the actual table
    const { data: existing, error: existingError } = await supabase
      .from('user_mission_progress')
      .select('user_id, mission_id, progress, completed, completed_at')
      .eq('user_id', userId)
      .eq('mission_id', mission.id)
      .maybeSingle();
    
    if (existingError && existingError.code !== 'PGRST116') {
      console.error(`❌ Error checking mission ${mission.id} progress:`, existingError);
      continue; // Skip this mission if there's an error
    }
    
    if (existing) {
      // CRITICAL: Force reset progress and completed flag - even if already reset
      // This ensures no stale completed flags remain
      const { data: updated, error: updateError } = await supabase
        .from('user_mission_progress')
        .update({
          progress: 0,
          completed: false, // FORCE false - clear any stale completed flags
          completed_at: null // Clear completion timestamp
          // Note: started_at column doesn't exist in actual database
        })
        .eq('user_id', userId)
        .eq('mission_id', mission.id)
        .select('progress, completed, completed_at')
        .single();
      
      if (updateError) {
        console.error(`❌ Failed to reset mission ${mission.id}:`, updateError);
      } else {
        // Verify the reset worked - log warning if completed is still true
        if (updated?.completed === true) {
          console.warn(`⚠️ WARNING: Mission ${mission.id} reset but completed flag is still true!`);
        }
        
        if (!updated) {
          console.warn(`⚠️ WARNING: Mission ${mission.id} reset but no updated data returned!`);
        }
        console.log(`✅ Reset mission ${mission.id} (${mission.name}):`, {
          progress: updated?.progress,
          completed: updated?.completed,
          completed_at: updated?.completed_at
        });
      }
    } else {
      // Create new progress entry (doesn't exist yet)
        const { error: insertError } = await supabase
          .from('user_mission_progress')
          .insert({
            user_id: userId,
            mission_id: mission.id,
            progress: 0,
            completed: false
            // Note: started_at and created_at columns don't exist in actual database
          });
      
      if (insertError) {
        console.error(`❌ Failed to create progress entry for mission ${mission.id}:`, insertError);
      } else {
        console.log(`✅ Created progress entry for mission ${mission.id} (${mission.name})`);
      }
    }
  }
  
  console.log(`🔄 Reset ${dailyMissions.length} daily missions for user ${userId}`);
}

/**
 * Check if daily missions should be reset (called on login, mission check, etc.)
 * This checks if it's been 24 hours since last reset and resets daily missions
 */
export async function checkAndResetDailyMissions(userId: string) {
  const supabase = createServerSupabaseClient();
  
  try {
    // Get all daily missions
    const dailyMissions = await getMissionsByType('daily');
    
    if (!dailyMissions || dailyMissions.length === 0) {
      console.log(`⚠️ No daily missions found for user ${userId}`);
      return;
    }

    // Get user's mission progress for all daily missions
    // Note: Only select columns that actually exist in the database
    const missionIds = dailyMissions.map(m => m.id);
    const { data: existingProgress } = await supabase
      .from('user_mission_progress')
      .select('mission_id, progress, completed, completed_at')
      .eq('user_id', userId)
      .in('mission_id', missionIds);

    const now = new Date();
    let shouldReset = false;
    let resetReason = '';

    // Check if user has no progress at all (first time user)
    if (!existingProgress || existingProgress.length === 0) {
      shouldReset = true;
      resetReason = 'First time user - no mission progress';
    } else {
      // Note: started_at, updated_at, and created_at don't exist
      // Use completed_at as fallback, or check for stale data
      const todayDate = now.toDateString();
      
      for (const progress of existingProgress) {
        // Check for stale completed flags
        if (progress.completed === true && progress.progress === 0) {
          shouldReset = true;
          resetReason = 'Stale completed flag (completed=true but progress=0)';
          break;
        }
        
        // Use completed_at if available for date checking
        if (progress.completed_at) {
          const completedDate = new Date(progress.completed_at);
          const completedDateString = completedDate.toDateString();
          
          // If completed on a different day, reset
          if (completedDateString !== todayDate) {
            shouldReset = true;
            resetReason = `Different calendar day (last completed: ${completedDateString}, today: ${todayDate})`;
            break;
          }
        } else {
          // If no completed_at and not completed, assume needs reset (fresh daily mission)
          // But if progress > 0 and not completed, it's in progress - don't reset
          if (progress.progress === 0 && progress.completed === false) {
            // Already reset or fresh - check if we should reset based on other missions
            // If all missions are in this state, it's likely a fresh state - still reset to ensure consistency
            shouldReset = true;
            resetReason = 'No completion timestamp - reset to ensure consistency';
            break;
          }
        }
      }
    }

    if (shouldReset) {
      console.log(`🔄 RESETTING daily missions for user ${userId}...`);
      await resetDailyMissions(userId);
      
      // Verify the reset worked by checking progress after reset
      // Note: Only select columns that exist
      const { data: afterReset } = await supabase
        .from('user_mission_progress')
        .select('mission_id, progress, completed, completed_at')
        .eq('user_id', userId)
        .in('mission_id', missionIds)
        .limit(5);
      
      console.log(`✅ Daily missions reset for user ${userId}`, {
        reason: resetReason,
        missionsCount: dailyMissions.length,
        existingProgressCount: existingProgress?.length || 0,
        now: now.toISOString(),
        afterResetSample: afterReset?.slice(0, 3).map(p => ({
          mission_id: p.mission_id,
          progress: p.progress,
          completed: p.completed,
          completed_at: p.completed_at
        }))
      });
    } else {
      console.log(`ℹ️ Daily missions NOT reset for user ${userId}`, {
        existingProgressCount: existingProgress?.length || 0,
        now: now.toISOString(),
        reason: 'No reset needed'
      });
    }
  } catch (error) {
    console.error('❌ Error checking daily mission reset:', error);
  }
}

/**
 * Award daily login mission progress
 */
export async function awardDailyLoginMission(userId: string) {
  try {
    const supabase = createServerSupabaseClient();
    
    // First, check if daily_login mission exists
    const { data: dailyLoginMissions } = await supabase
      .from('missions')
      .select('id, name, requirement_type')
      .eq('requirement_type', 'daily_login')
      .eq('is_active', true);
    
    if (!dailyLoginMissions || dailyLoginMissions.length === 0) {
      console.warn(`⚠️ No daily_login missions found in database for user ${userId}`);
      return;
    }
    
    console.log(`📋 Found ${dailyLoginMissions.length} daily_login mission(s)`, dailyLoginMissions.map(m => ({ id: m.id, name: m.name })));
    
    // Track progress for daily login
    await trackMissionProgress(userId, 'daily_login', 1);
    console.log(`✅ Daily login mission progress awarded to user ${userId}`);
  } catch (error) {
    console.error('❌ Error awarding daily login mission:', error);
    // Don't throw - we want login to succeed even if mission tracking fails
  }
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
