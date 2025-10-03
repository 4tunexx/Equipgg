import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url);
    const includeProgress = searchParams.get('include_progress') === 'true';
    
    // Get all active missions
    const { data: missions, error } = await supabase
      .from('missions')
      .select('*')
      .eq('is_active', true)
      .order('id', { ascending: true });
    
    if (error) {
      console.error('Missions error:', error)
      return NextResponse.json({ error: 'Failed to fetch missions' }, { status: 500 })
    }
    
    if (!includeProgress) {
      return NextResponse.json({ missions: missions || [] });
    }
    
    // Get user's progress for each mission
    const { data: progress, error: progressError } = await supabase
      .from('user_mission_progress')
      .select('*')
      .eq('user_id', user.id);
    
    if (progressError) {
      console.error('Progress error:', progressError)
    }
    
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
    
    return NextResponse.json({ 
      missions: missionsWithProgress || [],
      total: missions?.length || 0
    })

  } catch (error) {
    console.error('Missions API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}