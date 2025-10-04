import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createServerSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from session cookie
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()
    
    // Get all missions
    const { data: missions, error: missionsError } = await supabase
      .from('missions')
      .select('*')
      .eq('is_active', true)

    if (missionsError) {
      console.error('Error fetching missions:', missionsError);
      return NextResponse.json({ error: 'Failed to fetch missions' }, { status: 500 });
    }

    // Get user mission progress
    const { data: userProgress, error: progressError } = await supabase
      .from('user_mission_progress')
      .select('*')
      .eq('user_id', user.id)

    if (progressError) {
      console.error('Error fetching user progress:', progressError);
      // If no progress table, assume no missions completed
    }

    // Calculate stats
    const dailyMissions = missions.filter(m => m.mission_type === 'daily');
    const mainMissions = missions.filter(m => m.mission_type === 'main');
    
    const completedDaily = userProgress ? 
      userProgress.filter(p => {
        const mission = missions.find(m => m.id === parseInt(p.mission_id));
        return mission && mission.mission_type === 'daily' && (p.completed || p.progress >= (mission.requirement_value || 1));
      }).length : 0;
      
    const completedMain = userProgress ? 
      userProgress.filter(p => {
        const mission = missions.find(m => m.id === parseInt(p.mission_id));
        return mission && mission.mission_type === 'main' && (p.completed || p.progress >= (mission.requirement_value || 1));
      }).length : 0;

    return NextResponse.json({
      dailyCompleted: completedDaily,
      totalDaily: dailyMissions.length,
      totalMissions: mainMissions.length,
      completedMissions: completedMain
    });

  } catch (error) {
    console.error('Mission summary error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
