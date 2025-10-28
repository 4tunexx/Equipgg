import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { createNotification } from "@/lib/notification-utils";
import { trackMissionCompleted } from "@/lib/activity-tracker";
import { getAuthSession } from "@/lib/auth-utils";

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

    if (error) throw error;

    return NextResponse.json({ 
      success: true,
      progress: progress || []
    });
  } catch (error) {
    console.error('Error fetching mission progress:', error);
    return NextResponse.json({ error: 'Failed to fetch mission progress' }, { status: 500 });
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

    // Upsert mission progress
    const { data, error } = await supabase
      .from('user_mission_progress')
      .upsert({
        user_id: userId,
        mission_id: missionId,
        progress,
        completed,
        updated_at: new Date().toISOString()
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

    // Mark mission as completed
    const { error: progressError } = await supabase
      .from('user_mission_progress')
      .upsert({
        user_id: userId,
        mission_id: missionId,
        progress: mission.target_value || 1,
        completed: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
