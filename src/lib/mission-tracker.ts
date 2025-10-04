// Mission tracking utility for Supabase
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

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
            current_progress: Math.min(progress.current_progress + 1, mission.requirement_value),
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
            current_progress: 1,
            target_progress: mission.requirement_value,
            completed: false
          });
      }
    }
    
    console.log(`Tracking shop visit for user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Error tracking shop visit:', error);
    return { success: false, error };
  }
}

export async function trackCrateOpened(userId: string, crateId: string, supabaseClient?: SupabaseClient) {
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
            current_progress: Math.min(progress.current_progress + 1, mission.requirement_value),
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
            current_progress: 1,
            target_progress: mission.requirement_value,
            completed: false
          });
      }
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
      .in('requirement_type', ['place_bet', 'win_bet', 'bet_amount', 'game_play'])
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
      
      let progressIncrement = 1;
      if (mission.requirement_type === 'bet_amount') {
        progressIncrement = amount; // Track total bet amount
      } else if (mission.requirement_type === 'place_bet') {
        progressIncrement = 1; // Count number of bets placed
      }
      
      if (progress) {
        // Update existing progress
        await client
          .from('user_mission_progress')
          .update({ 
            current_progress: Math.min(progress.current_progress + progressIncrement, mission.requirement_value),
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
            current_progress: progressIncrement,
            target_progress: mission.requirement_value,
            completed: false
          });
      }
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
