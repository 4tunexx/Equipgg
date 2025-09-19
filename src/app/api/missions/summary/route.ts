import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { getAuthSession } from "../../../../lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    const authSession = await getAuthSession(request);
    if (!authSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user's mission progress summary
    const { data: progressData, error: progressError } = await supabase
      .from('mission_progress')
      .select(`
        *,
        missions!inner(title, reward_type, reward_value, difficulty)
      `)
      .eq('user_id', authSession.user_id);
    
    if (progressError) throw progressError;
    
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
    }, {} as Record<number, number>) || {};
    
    const completedByDifficulty = completedMissions.reduce((acc, p) => {
      const difficulty = p.missions.difficulty;
      acc[difficulty] = (acc[difficulty] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const summary = {
      totalMissions: allMissions?.length || 0,
      completedMissions: completedMissions.length,
      activeMissions: activeMissions.length,
      completionRate: allMissions?.length 
        ? Math.round((completedMissions.length / allMissions.length) * 100) 
        : 0,
      totalRewardsEarned,
      totalGemsEarned,
      missionsByDifficulty,
      completedByDifficulty,
      recentCompletions: completedMissions
        .sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime())
        .slice(0, 5)
        .map(p => ({
          title: p.missions.title,
          completedAt: p.completed_at,
          reward: {
            type: p.missions.reward_type,
            value: p.missions.reward_value
          }
        }))
    };
    
    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error fetching mission summary:', error);
    return NextResponse.json({ error: 'Failed to fetch mission summary' }, { status: 500 });
  }
}