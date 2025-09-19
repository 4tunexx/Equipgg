import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { getAuthSession } from "../../../lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    const authSession = await getAuthSession(request);
    if (!authSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const includeProgress = searchParams.get('include_progress') === 'true';
    
    // Get all active missions
    const { data: missions, error } = await supabase
      .from('missions')
      .select('*')
      .eq('is_active', true)
      .order('difficulty', { ascending: true });
    
    if (error) throw error;
    
    if (!includeProgress) {
      return NextResponse.json({ missions });
    }
    
    // Get user's progress for each mission
    const { data: progress, error: progressError } = await supabase
      .from('mission_progress')
      .select('*')
      .eq('user_id', authSession.user_id);
    
    if (progressError) throw progressError;
    
    // Merge progress with missions
    const missionsWithProgress = missions?.map(mission => {
      const userProgress = progress?.find(p => p.mission_id === mission.id);
      return {
        ...mission,
        progress: userProgress || {
          current_progress: 0,
          target_progress: mission.target_value,
          completed: false
        }
      };
    });
    
    return NextResponse.json({ missions: missionsWithProgress });
  } catch (error) {
    console.error('Error fetching missions:', error);
    return NextResponse.json({ error: 'Failed to fetch missions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authSession = await getAuthSession(request);
    if (!authSession || authSession.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { title, description, type, target_value, reward_type, reward_value, difficulty } = await request.json();
    
    if (!title || !type || !target_value || !reward_type || !reward_value) {
      return NextResponse.json({ 
        error: 'Title, type, target_value, reward_type, and reward_value are required' 
      }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('missions')
      .insert({
        title,
        description: description || null,
        type,
        target_value,
        reward_type,
        reward_value,
        difficulty: difficulty || 1,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ mission: data });
  } catch (error) {
    console.error('Error creating mission:', error);
    return NextResponse.json({ error: 'Failed to create mission' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authSession = await getAuthSession(request);
    if (!authSession || authSession.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id, ...updates } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Mission ID is required' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('missions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ mission: data });
  } catch (error) {
    console.error('Error updating mission:', error);
    return NextResponse.json({ error: 'Failed to update mission' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authSession = await getAuthSession(request);
    if (!authSession || authSession.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Mission ID is required' }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('missions')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting mission:', error);
    return NextResponse.json({ error: 'Failed to delete mission' }, { status: 500 });
  }
}