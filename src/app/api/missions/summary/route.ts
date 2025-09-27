import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { getAuthSession } from "../../../../lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    const authSession = await getAuthSession(request);
    
    // Return default/fallback data if no session or database not set up
    if (!authSession) {
      return NextResponse.json({
        totalMissions: 0,
        completedMissions: 0,
        activeMissions: 0,
        totalRewardsEarned: 0,
        totalGemsEarned: 0,
        missionsByDifficulty: {
          easy: 0,
          medium: 0,
          hard: 0
        },
        recentlyCompleted: [],
        dailyMissionsCompleted: 0,
        totalDailyMissions: 3
      });
    }
    
    try {
      // Try to get user's mission progress summary from database
      const { data: progressData, error: progressError } = await supabase
        .from('user_mission_progress')
        .select(`
          *,
          missions!inner(title, reward_type, reward_value, difficulty)
        `)
        .eq('user_id', authSession.user_id);
      
      if (progressError) {
        console.log('Mission progress table not found, returning default data');
        throw progressError;
      }
      
      // Calculate summary statistics
      const completedMissions = progressData?.filter(p => p.completed) || [];
      const activeMissions = progressData?.filter(p => !p.completed) || [];
      
      const totalRewardsEarned = completedMissions.reduce((sum, p) => {
        if (p.missions.reward_type === 'coins') {
          return sum + p.missions.reward_value;
        }
        return sum;
      }, 0);
      
      const totalGemsEarned = completedMissions.reduce((sum, p) => {
        if (p.missions.reward_type === 'gems') {
          return sum + p.missions.reward_value;
        }
        return sum;
      }, 0);
      
      // Get mission counts by difficulty
      const { data: allMissions, error: missionsError } = await supabase
        .from('missions')
        .select('difficulty')
        .eq('is_active', true);
      
      if (missionsError) throw missionsError;
      
      const missionsByDifficulty = allMissions?.reduce((acc, m) => {
        acc[m.difficulty] = (acc[m.difficulty] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return NextResponse.json({
        totalMissions: progressData?.length || 0,
        completedMissions: completedMissions.length,
        activeMissions: activeMissions.length,
        totalRewardsEarned,
        totalGemsEarned,
        missionsByDifficulty,
        recentlyCompleted: completedMissions.slice(-5).map(p => ({
          title: p.missions.title,
          completed_at: p.completed_at,
          reward_type: p.missions.reward_type,
          reward_value: p.missions.reward_value
        })),
        dailyMissionsCompleted: completedMissions.filter(p => 
          p.missions.difficulty === 'daily' && 
          new Date(p.completed_at).toDateString() === new Date().toDateString()
        ).length,
        totalDailyMissions: 3
      });
      
    } catch (dbError) {
      console.log('Database not set up yet, returning default mission data');
      
      // Return default data when database tables don't exist yet
      return NextResponse.json({
        totalMissions: 0,
        completedMissions: 0,
        activeMissions: 3,
        totalRewardsEarned: 0,
        totalGemsEarned: 0,
        missionsByDifficulty: {
          easy: 1,
          medium: 1,
          hard: 1
        },
        recentlyCompleted: [],
        dailyMissionsCompleted: 0,
        totalDailyMissions: 3
      });
    }
    
  } catch (error) {
    console.error('Mission summary API error:', error);
    
    // Return default data on any error
    return NextResponse.json({
      totalMissions: 0,
      completedMissions: 0,
      activeMissions: 0,
      totalRewardsEarned: 0,
      totalGemsEarned: 0,
      missionsByDifficulty: {
        easy: 0,
        medium: 0,
        hard: 0
      },
      recentlyCompleted: [],
      dailyMissionsCompleted: 0,
      totalDailyMissions: 3
    });
  }
}