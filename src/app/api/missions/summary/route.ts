import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getUserIdFromCookie } from '@/lib/session-utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get user ID from session cookie
    const userId = getUserIdFromCookie(request);
    
    console.log('🔐 Missions Summary - userId:', userId);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get all missions
    console.log('📝 Fetching missions from database...');
    const { data: missions, error: missionsError } = await supabase
      .from('missions')
      .select('*')
      .eq('is_active', true)

    if (missionsError) {
      console.error('❌ Error fetching missions:', missionsError);
      return NextResponse.json({ error: 'Failed to fetch missions' }, { status: 500 });
    }
    
    console.log(`✅ Found ${missions?.length || 0} active missions`);
    if (missions && missions.length > 0) {
      console.log('👀 Sample missions:', missions.slice(0, 3).map(m => ({
        id: m.id,
        name: m.name,
        type: m.mission_type,
        idType: typeof m.id
      })));
    } else {
      console.warn('⚠️ No active missions found in database!');
    }

    // Get user mission progress
    console.log('📈 Fetching user progress...');
    const { data: userProgress, error: progressError } = await supabase
      .from('user_mission_progress')
      .select('*')
      .eq('user_id', userId)

    if (progressError) {
      console.error('❌ Error fetching user progress:', progressError);
      console.error('Progress error details:', JSON.stringify(progressError, null, 2));
      // If no progress table, assume no missions completed
    }
    
    console.log(`📊 Found ${userProgress?.length || 0} progress records`);
    if (userProgress && userProgress.length > 0) {
      console.log('👀 Sample progress:', userProgress.slice(0, 3).map(p => ({
        mission_id: p.mission_id,
        progress: p.progress,
        completed: p.completed,
        idType: typeof p.mission_id
      })));
    }

    // Calculate stats
    console.log('🧮 Calculating mission stats...');
    const dailyMissions = missions.filter(m => m.mission_type === 'daily');
    const mainMissions = missions.filter(m => m.mission_type === 'main');
    
    console.log(`📅 Daily missions: ${dailyMissions.length}`);
    console.log(`🎯 Main missions: ${mainMissions.length}`);
    
    const completedDaily = userProgress ? 
      userProgress.filter(p => {
        // Try both string and number comparison for compatibility
        const mission = missions.find(m => m.id == p.mission_id || m.id === parseInt(p.mission_id));
        const isComplete = mission && mission.mission_type === 'daily' && (p.completed || p.progress >= (mission.requirement_value || 1));
        if (isComplete) {
          console.log(`✅ Daily mission completed: ${mission.name} (${p.progress}/${mission.requirement_value})`);
        }
        return isComplete;
      }).length : 0;
      
    const completedMain = userProgress ? 
      userProgress.filter(p => {
        // Try both string and number comparison for compatibility
        const mission = missions.find(m => m.id == p.mission_id || m.id === parseInt(p.mission_id));
        const isComplete = mission && mission.mission_type === 'main' && (p.completed || p.progress >= (mission.requirement_value || 1));
        if (isComplete) {
          console.log(`✅ Main mission completed: ${mission.name} (${p.progress}/${mission.requirement_value})`);
        }
        return isComplete;
      }).length : 0;
    
    console.log(`📊 Summary calculated:`, {
      dailyCompleted: completedDaily,
      totalDaily: dailyMissions.length,
      completedMissions: completedMain,
      totalMissions: mainMissions.length
    });

    const result = {
      dailyCompleted: completedDaily,
      totalDaily: dailyMissions.length,
      totalMissions: mainMissions.length,
      completedMissions: completedMain
    };
    
    console.log('🎉 Returning summary:', result);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Mission summary error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
