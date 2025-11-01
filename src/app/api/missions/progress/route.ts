import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { createNotification } from "@/lib/notification-utils";
import { trackMissionCompleted } from "@/lib/activity-tracker";
import { getAuthSession } from "@/lib/auth-utils";
import { checkAndResetDailyMissions } from "@/lib/mission-integration";

// Get user's mission progress
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get authenticated session
    const session = await getAuthSession(request);
    
    console.log('Mission progress endpoint - auth check:', { userId: session?.user_id });
    
    // If no session, return unauthorized
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = session.user_id;

    // CRITICAL: Check and reset daily missions BEFORE fetching progress
    // This ensures missions are reset every 24 hours when user views missions page
    try {
      console.log(`🔄 Mission progress endpoint - checking reset for user ${userId}`);
      await checkAndResetDailyMissions(userId);
      console.log(`✅ Daily missions reset check completed for user ${userId}`);
    } catch (resetError) {
      console.error('⚠️ Failed to reset daily missions in progress endpoint:', resetError);
      // Continue anyway - don't block progress fetching
    }

    const { searchParams } = new URL(request.url);
    const missionId = searchParams.get('missionId');

    let query = supabase
      .from('user_mission_progress')
      .select('*')
      .eq('user_id', session.user_id);

    if (missionId) {
      query = query.eq('mission_id', missionId);
    }

    const { data: progress, error } = await query;

    if (error) {
      console.error('❌ Progress query error:', error);
      // Return empty progress array instead of error - missions page should still work
      return NextResponse.json({ 
        success: true,
        progress: []
      });
    }
    
    // SAFETY CHECK: Fix stale daily missions that should have reset
    // Daily missions must reset if:
    // 1. completed=true but progress=0 (stale completed flag)
    // 2. completed=true but progress < requirement (incomplete but marked complete)
    // Note: Can't check dates because started_at column doesn't exist in database
    if (progress && progress.length > 0) {
      // Get all daily missions to identify which ones need checking
      const { data: dailyMissions } = await supabase
        .from('missions')
        .select('id, mission_type, requirement_value')
        .eq('mission_type', 'daily')
        .eq('is_active', true);
      
      const dailyMissionIds = new Set(dailyMissions?.map((m: any) => m.id) || []);
      const dailyMissionRequirements = new Map(dailyMissions?.map((m: any) => [m.id, m.requirement_value || 1]) || []);
      
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
      
      const staleMissions: any[] = [];
      
      for (const p of progress) {
        const isDaily = dailyMissionIds.has(p.mission_id);
        if (!isDaily) continue; // Only fix daily missions
        
        const requirement = dailyMissionRequirements.get(p.mission_id) || 1;
        
        // Note: started_at column doesn't exist, so we can't check dates
        // Only fix obvious stale data: completed=true but progress doesn't match
        
        // Case 1: completed=true but progress=0 (stale completed flag)
        if (p.completed === true && p.progress === 0) {
          staleMissions.push({ ...p, reason: 'completed=true but progress=0' });
        }
        // Case 2: completed=true but progress < requirement (incomplete but marked complete)
        else if (p.completed === true && p.progress < requirement) {
          staleMissions.push({ ...p, reason: `completed=true but progress=${p.progress} < requirement=${requirement}` });
        }
        // Case 3: progress >= requirement but completed=false (complete but not marked)
        // Don't fix this - let it be marked complete naturally
      }
      
      if (staleMissions.length > 0) {
        console.warn(`⚠️ Found ${staleMissions.length} daily missions with stale data. Fixing...`);
        const nowISO = new Date().toISOString();
        for (const stale of staleMissions) {
          console.log(`  🔧 Fixing daily mission ${stale.mission_id}: ${stale.reason}`);
          const { error: fixError } = await supabase
            .from('user_mission_progress')
            .update({ 
              completed: false, 
              completed_at: null,
              progress: 0 // Reset progress to 0
              // Note: started_at column doesn't exist
            })
            .eq('user_id', userId)
            .eq('mission_id', stale.mission_id);
          
          if (fixError) {
            console.error(`❌ Failed to fix stale mission ${stale.mission_id}:`, fixError);
          } else {
            console.log(`✅ Fixed stale mission ${stale.mission_id}`);
            // Update the progress array locally
            const index = progress.findIndex((p: any) => p.mission_id === stale.mission_id);
            if (index >= 0) {
              (progress[index] as any).completed = false;
              (progress[index] as any).completed_at = null;
              (progress[index] as any).progress = 0;
            }
          }
        }
      }
    }
    
    console.log(`📊 Progress query result for user ${userId}:`, {
      progressCount: progress?.length || 0,
      sampleProgress: progress?.slice(0, 3).map((p: any) => ({
        mission_id: p.mission_id,
        progress: p.progress,
        completed: p.completed,
        completed_at: p.completed_at
      }))
    });

    return NextResponse.json({ 
      success: true,
      progress: progress || []
    });
  } catch (error) {
    console.error('❌ Error fetching mission progress:', error);
    // Return empty progress instead of 500 error - don't break missions page
    return NextResponse.json({ 
      success: true,
      progress: []
    });
  }
}

// Update mission progress
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get authenticated session
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = session.user_id;

    const { missionId, progress = 1, completed = false } = await request.json();

    if (!missionId) {
      return NextResponse.json({ error: 'Mission ID is required' }, { status: 400 });
    }

    // Upsert mission progress (note: user_mission_progress table doesn't have updated_at column)
    const { data, error } = await supabase
      .from('user_mission_progress')
      .upsert({
        user_id: userId,
        mission_id: missionId,
        progress,
        completed
      }, { onConflict: 'user_id,mission_id' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, progress: data });
  } catch (error) {
    console.error('Error updating mission progress:', error);
    return NextResponse.json({ error: 'Failed to update mission progress' }, { status: 500 });
  }
}

// Complete a mission (award rewards)
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get authenticated session
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = session.user_id;

    const { missionId } = await request.json();

    if (!missionId) {
      return NextResponse.json({ error: 'Mission ID is required' }, { status: 400 });
    }

    // Get mission details first
    const { data: mission, error: missionError } = await supabase
      .from('missions')
      .select('*')
      .eq('id', missionId)
      .single();

    if (missionError || !mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    // Mark mission as completed (note: user_mission_progress table doesn't have updated_at column)
    const { error: progressError } = await supabase
      .from('user_mission_progress')
      .upsert({
        user_id: userId,
        mission_id: missionId,
        progress: mission.requirement_value || 1, // Fixed: was mission.target_value
        completed: true,
        completed_at: new Date().toISOString()
      }, { onConflict: 'user_id,mission_id' });

    if (progressError) throw progressError;

    // Get current user data first
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('xp, coins')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    // Award XP/coins/gems and recalc level for consistency
    const { getLevelFromXP } = await import('../../../../lib/xp-config');
    const newXP = (currentUser.xp || 0) + (mission.xp_reward || 0);
    const newLevel = getLevelFromXP(newXP);

    const { error: userError } = await supabase
      .from('users')
      .update({
        xp: newXP,
        level: newLevel,
        coins: (currentUser.coins || 0) + (mission.coin_reward || 0),
        gems: (currentUser as any).gems !== undefined ? ((currentUser as any).gems || 0) + (mission.gem_reward || 0) : undefined
      })
      .eq('id', userId);

    if (userError) throw userError;

    // Create user notification
    try {
      await createNotification({
        userId,
        type: 'mission_completed',
        title: '✅ Mission Complete!',
        message: `${mission.name} completed! +${mission.xp_reward || 0} XP${mission.coin_reward ? `, +${mission.coin_reward} coins` : ''}${mission.gem_reward ? `, +${mission.gem_reward} gems` : ''}`,
        data: { missionId, xp: mission.xp_reward, coins: mission.coin_reward, gems: mission.gem_reward }
      });
    } catch {}

    // Log activity (non-blocking)
    try { await trackMissionCompleted(userId, mission.name, mission.xp_reward || 0); } catch {}

    return NextResponse.json({ 
      success: true, 
      rewards: {
        xp: mission.xp_reward || 0,
        coins: mission.coin_reward || 0,
        gems: mission.gem_reward || 0,
        level: newLevel
      }
    });
  } catch (error) {
    console.error('Error completing mission:', error);
    return NextResponse.json({ error: 'Failed to complete mission' }, { status: 500 });
  }
}

// Reset mission progress (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get authenticated session
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, we'll skip the admin check since we don't have the role system implemented
    // TODO: Add proper admin role checking
    
    const { searchParams } = new URL(request.url);
    const missionId = searchParams.get('missionId');
    const targetUserId = searchParams.get('userId');

    if (!missionId || !targetUserId) {
      return NextResponse.json({ error: 'Mission ID and User ID are required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_mission_progress')
      .delete()
      .eq('mission_id', missionId)
      .eq('user_id', targetUserId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resetting mission progress:', error);
    return NextResponse.json({ error: 'Failed to reset mission progress' }, { status: 500 });
  }
}
