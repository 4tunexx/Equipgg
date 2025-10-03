import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// Get user's mission progress
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url);
    const missionId = searchParams.get('missionId');

    let query = supabase
      .from('user_mission_progress')
      .select(`
        *,
        missions!inner(*)
      `)
      .eq('user_id', user.id);

    if (missionId) {
      query = query.eq('mission_id', missionId);
    }

    const { data: progress, error } = await query;

    if (error) throw error;

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Error fetching mission progress:', error);
    return NextResponse.json({ error: 'Failed to fetch mission progress' }, { status: 500 });
  }
}

// Update mission progress
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { missionId, progress = 1, completed = false } = await request.json();

    if (!missionId) {
      return NextResponse.json({ error: 'Mission ID is required' }, { status: 400 });
    }

    // Upsert mission progress
    const { data, error } = await supabase
      .from('user_mission_progress')
      .upsert({
        user_id: user.id,
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
    const supabase = createServerSupabaseClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
        user_id: user.id,
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
      .eq('id', user.id)
      .single();

    if (fetchError) throw fetchError;

    // Award XP and coins to user
    const { error: userError } = await supabase
      .from('users')
      .update({
        xp: (currentUser.xp || 0) + (mission.xp_reward || 0),
        coins: (currentUser.coins || 0) + (mission.coin_reward || 0)
      })
      .eq('id', user.id);

    if (userError) throw userError;

    return NextResponse.json({ 
      success: true, 
      rewards: {
        xp: mission.xp_reward || 0,
        coins: mission.coin_reward || 0
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
    const supabase = createServerSupabaseClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, we'll skip the admin check since we don't have the role system implemented
    // TODO: Add proper admin role checking
    
    const { searchParams } = new URL(request.url);
    const missionId = searchParams.get('missionId');
    const userId = searchParams.get('userId');

    if (!missionId || !userId) {
      return NextResponse.json({ error: 'Mission ID and User ID are required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_mission_progress')
      .delete()
      .eq('mission_id', missionId)
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resetting mission progress:', error);
    return NextResponse.json({ error: 'Failed to reset mission progress' }, { status: 500 });
  }
}
