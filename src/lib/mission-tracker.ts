// Mission tracking utility for Supabase
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { createNotification } from './notification-utils';

// Helper function to check and award mission rewards
async function checkAndAwardMissionRewards(userId: string, missionId: number, client: SupabaseClient) {
  try {
    // Get mission progress
    const { data: progress } = await client
      .from('user_mission_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('mission_id', missionId)
      .single();
    
    if (!progress) return;
    
    // Get mission details
    const { data: mission } = await client
      .from('missions')
      .select('*')
      .eq('id', missionId)
      .single();
    
    if (!mission) return;
    
    // Check if mission is completed and not yet claimed
    if ((progress as any).progress >= mission.requirement_value && !progress.completed) {
      console.log(`🎉 Mission ${mission.name} completed! Awarding rewards...`);
      
      // Mark mission as completed
      await client
        .from('user_mission_progress')
        .update({
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', progress.id);
      
      // Get current user data
      const { data: user } = await client
        .from('users')
        .select('xp, coins, gems, level')
        .eq('id', userId)
        .single();
      
      if (!user) return;
      
      // Award rewards
      const newXp = (user.xp || 0) + (mission.xp_reward || 0);
      const newCoins = (user.coins || 0) + (mission.coin_reward || 0);
      const newGems = (user.gems || 0) + (mission.gem_reward || 0);
      
      await client
        .from('users')
        .update({
          xp: newXp,
          coins: newCoins,
          gems: newGems
        })
        .eq('id', userId);
      
      console.log(`✅ Rewards awarded: +${mission.xp_reward} XP, +${mission.coin_reward} coins, +${mission.gem_reward} gems`);
      
      // Notification + activity entry
      try {
        await createNotification({
          userId,
          type: 'mission_completed',
          title: '✅ Mission Complete!',
          message: `${mission.name} completed! +${mission.xp_reward || 0} XP${mission.coin_reward ? `, +${mission.coin_reward} coins` : ''}${mission.gem_reward ? `, +${mission.gem_reward} gems` : ''}`,
          data: { missionId, xp: mission.xp_reward, coins: mission.coin_reward, gems: mission.gem_reward }
        });
      } catch {}
      await client
        .from('activity_feed')
        .insert({
          user_id: userId,
          action: 'mission_completed',
          description: `Completed mission: ${mission.name}! Earned ${mission.xp_reward} XP${mission.coin_reward ? ` and ${mission.coin_reward} coins` : ''}`,
          metadata: { mission_id: missionId, mission_name: mission.name, xp_reward: mission.xp_reward, coin_reward: mission.coin_reward, gem_reward: mission.gem_reward },
          created_at: new Date().toISOString()
        });
      
      return { success: true, rewards: { xp: mission.xp_reward, coins: mission.coin_reward, gems: mission.gem_reward } };
    }
  } catch (error) {
    console.error('Error checking/awarding mission rewards:', error);
  }
}

export async function trackShopVisit(userId: string, supabaseClient?: SupabaseClient) {
  try {
    const client = supabaseClient || supabase;
    
    // Check if there's an active mission for shop visits
    const { data: missions } = await client
      .from('missions')
      .select('*')
      .eq('requirement_type', 'shop_visit')
      .eq('is_active', true);
    
    if (!missions?.length) return { success: true };
    
    // Update or create mission progress
    for (const mission of missions) {
      const { data: progress } = await client
        .from('user_mission_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('mission_id', mission.id)
        .single();
      
      if (progress) {
        // Update existing progress
        await client
          .from('user_mission_progress')
          .update({ 
            progress: Math.min(((progress as any).progress || 0) + 1, mission.requirement_value),
            updated_at: new Date().toISOString()
          })
          .eq('id', progress.id);
      } else {
        // Create new progress record
        await client
          .from('user_mission_progress')
          .insert({
            user_id: userId,
            mission_id: mission.id,
            progress: 1,
            completed: false
          });
      }
      
      // Check if mission is now completed and award rewards
      await checkAndAwardMissionRewards(userId, mission.id, client);
    }
    
    console.log(`Tracking shop visit for user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Error tracking shop visit:', error);
    return { success: false, error };
  }
}

export async function trackCrateOpened(userId: string, crateId: number, supabaseClient?: SupabaseClient) {
  try {
    const client = supabaseClient || supabase;
    
    // Check if there's an active mission for crate opening
    const { data: missions } = await client
      .from('missions')
      .select('*')
      .eq('requirement_type', 'open_crate')
      .eq('is_active', true);
    
    if (!missions?.length) return { success: true };
    
    // Update or create mission progress
    for (const mission of missions) {
      const { data: progress } = await client
        .from('user_mission_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('mission_id', mission.id)
        .single();
      
      if (progress) {
        // Update existing progress
        await client
          .from('user_mission_progress')
          .update({ 
            progress: Math.min(((progress as any).progress || 0) + 1, mission.requirement_value),
            updated_at: new Date().toISOString()
          })
          .eq('id', progress.id);
      } else {
        // Create new progress record
        await client
          .from('user_mission_progress')
          .insert({
            user_id: userId,
            mission_id: mission.id,
            progress: 1,
            completed: false
          });
      }
      
      // Check if mission is now completed and award rewards
      await checkAndAwardMissionRewards(userId, mission.id, client);
    }
    
    // Log the crate opening activity
    await client
      .from('activity_feed')
      .insert({
        user_id: userId,
        action: 'crate_opened',
        description: `Opened crate with ID: ${crateId}`,
        metadata: { crate_id: crateId },
        created_at: new Date().toISOString()
      });
    
    console.log(`Tracking crate opened for user ${userId}, crate ${crateId}`);
    return { success: true };
  } catch (error) {
    console.error('Error tracking crate opened:', error);
    return { success: false, error };
  }
}

export async function trackBetPlaced(userId: string, amount: number, gameType: string, supabaseClient?: SupabaseClient) {
  try {
    const client = supabaseClient || supabase;
    
    // Check if there's an active mission for betting
    const { data: missions } = await client
      .from('missions')
      .select('*')
      .in('requirement_type', ['place_bet', 'win_bet', 'bet_amount', 'game_play', 'crash_game_bets'])
      .eq('is_active', true);
    
    if (!missions?.length) return { success: true };
    
    // Update or create mission progress
    for (const mission of missions) {
      // Skip crash game specific missions if not crash game
      if (mission.requirement_type === 'crash_game_bets' && gameType !== 'crash') {
        continue;
      }
      
      const { data: progress } = await client
        .from('user_mission_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('mission_id', mission.id)
        .single();
      
      let progressIncrement = 1;
      if (mission.requirement_type === 'bet_amount') {
        progressIncrement = amount; // Track total bet amount
      } else if (mission.requirement_type === 'place_bet' || mission.requirement_type === 'crash_game_bets') {
        progressIncrement = 1; // Count number of bets placed
      }
      
      if (progress) {
        // Update existing progress
        await client
          .from('user_mission_progress')
          .update({ 
            progress: Math.min(((progress as any).progress || 0) + progressIncrement, mission.requirement_value),
            updated_at: new Date().toISOString()
          })
          .eq('id', progress.id);
      } else {
        // Create new progress record
        await client
          .from('user_mission_progress')
          .insert({
            user_id: userId,
            mission_id: mission.id,
            progress: progressIncrement,
            completed: false
          });
      }
      
      // Check if mission is now completed and award rewards
      await checkAndAwardMissionRewards(userId, mission.id, client);
    }
    
    // Log the betting activity
    await client
      .from('activity_feed')
      .insert({
        user_id: userId,
        action: 'bet_placed',
        description: `Placed bet of ${amount} coins on ${gameType}`,
        metadata: { amount, game_type: gameType },
        created_at: new Date().toISOString()
      });
    
    console.log(`Tracking bet placed for user ${userId}, amount ${amount}, game ${gameType}`);
    return { success: true };
  } catch (error) {
    console.error('Error tracking bet placed:', error);
    return { success: false, error };
  }
}

export async function trackCrashGameEarnings(userId: string, earnings: number, supabaseClient?: SupabaseClient) {
  try {
    const client = supabaseClient || supabase;
    
    // Check if there's an active mission for crash game earnings
    const { data: missions } = await client
      .from('missions')
      .select('*')
      .eq('requirement_type', 'crash_game_earnings')
      .eq('is_active', true);
    
    if (!missions?.length) return { success: true };
    
    // Update or create mission progress
    for (const mission of missions) {
      const { data: progress } = await client
        .from('user_mission_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('mission_id', mission.id)
        .single();
      
      if (progress) {
        // Update existing progress
        await client
          .from('user_mission_progress')
          .update({ 
            progress: Math.min(((progress as any).progress || 0) + earnings, mission.requirement_value),
            updated_at: new Date().toISOString()
          })
          .eq('id', progress.id);
      } else {
        // Create new progress record
        await client
          .from('user_mission_progress')
          .insert({
            user_id: userId,
            mission_id: mission.id,
            progress: earnings,
            completed: false
          });
      }
      
      // Check if mission is now completed and award rewards
      await checkAndAwardMissionRewards(userId, mission.id, client);
    }
    
    console.log(`Tracking crash game earnings for user ${userId}, earnings ${earnings}`);
    return { success: true };
  } catch (error) {
    console.error('Error tracking crash game earnings:', error);
    return { success: false, error };
  }
}

// Additional mission tracking functions for missing features

export async function trackForumPost(userId: string, supabaseClient?: SupabaseClient) {
  try {
    const client = supabaseClient || supabase;
    
    const { data: missions } = await client
      .from('missions')
      .select('*')
      .eq('requirement_type', 'forum_post')
      .eq('is_active', true);
    
    if (!missions?.length) return { success: true };
    
    for (const mission of missions) {
      const { data: progress } = await client
        .from('user_mission_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('mission_id', mission.id)
        .single();
      
      if (progress) {
        await client
          .from('user_mission_progress')
          .update({ 
            progress: Math.min(((progress as any).progress || 0) + 1, mission.requirement_value),
            updated_at: new Date().toISOString()
          })
          .eq('id', progress.id);
      } else {
        await client
          .from('user_mission_progress')
          .insert({
            user_id: userId,
            mission_id: mission.id,
            progress: 1,
            completed: false
          });
      }
      
      await checkAndAwardMissionRewards(userId, mission.id, client);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error tracking forum post:', error);
    return { success: false, error };
  }
}

export async function trackVoteCast(userId: string, supabaseClient?: SupabaseClient) {
  try {
    const client = supabaseClient || supabase;
    
    const { data: missions } = await client
      .from('missions')
      .select('*')
      .eq('requirement_type', 'cast_vote')
      .eq('is_active', true);
    
    if (!missions?.length) return { success: true };
    
    for (const mission of missions) {
      const { data: progress } = await client
        .from('user_mission_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('mission_id', mission.id)
        .single();
      
      if (progress) {
        await client
          .from('user_mission_progress')
          .update({ 
            progress: Math.min(((progress as any).progress || 0) + 1, mission.requirement_value),
            updated_at: new Date().toISOString()
          })
          .eq('id', progress.id);
      } else {
        await client
          .from('user_mission_progress')
          .insert({
            user_id: userId,
            mission_id: mission.id,
            progress: 1,
            completed: false
          });
      }
      
      await checkAndAwardMissionRewards(userId, mission.id, client);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error tracking vote cast:', error);
    return { success: false, error };
  }
}

export async function trackLeaderboardCheck(userId: string, supabaseClient?: SupabaseClient) {
  try {
    const client = supabaseClient || supabase;
    
    const { data: missions } = await client
      .from('missions')
      .select('*')
      .eq('requirement_type', 'check_leaderboard')
      .eq('is_active', true);
    
    if (!missions?.length) return { success: true };
    
    for (const mission of missions) {
      const { data: progress } = await client
        .from('user_mission_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('mission_id', mission.id)
        .single();
      
      if (progress) {
        await client
          .from('user_mission_progress')
          .update({ 
            progress: Math.min(((progress as any).progress || 0) + 1, mission.requirement_value),
            updated_at: new Date().toISOString()
          })
          .eq('id', progress.id);
      } else {
        await client
          .from('user_mission_progress')
          .insert({
            user_id: userId,
            mission_id: mission.id,
            progress: 1,
            completed: false
          });
      }
      
      await checkAndAwardMissionRewards(userId, mission.id, client);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error tracking leaderboard check:', error);
    return { success: false, error };
  }
}

export async function trackLevelReached(userId: string, level: number, supabaseClient?: SupabaseClient) {
  try {
    const client = supabaseClient || supabase;
    
    const { data: missions } = await client
      .from('missions')
      .select('*')
      .eq('requirement_type', 'reach_level')
      .eq('is_active', true);
    
    if (!missions?.length) return { success: true };
    
    for (const mission of missions) {
      // Only track if the user has reached the required level
      if (level >= mission.requirement_value) {
        const { data: progress } = await client
          .from('user_mission_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('mission_id', mission.id)
          .single();
        
        if (!progress) {
          await client
            .from('user_mission_progress')
            .insert({
              user_id: userId,
              mission_id: mission.id,
              progress: mission.requirement_value,
              completed: true,
              completed_at: new Date().toISOString()
            });
          
          await checkAndAwardMissionRewards(userId, mission.id, client);
        }
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error tracking level reached:', error);
    return { success: false, error };
  }
}