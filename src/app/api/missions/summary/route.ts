import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "@/lib/supabase";

// GET /api/missions/summary - Get mission summary for user
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      // Return default/guest summary instead of error
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
        dailyCompleted: 0,
        totalDaily: 9
      });
    }

    // For now, return mock data that matches expected structure
    return NextResponse.json({
      totalMissions: 15,
      completedMissions: 3,
      activeMissions: 12,
      totalRewardsEarned: 500,
      totalGemsEarned: 50,
      missionsByDifficulty: {
        easy: 5,
        medium: 7,
        hard: 3
      },
      recentlyCompleted: [
        { title: "First Steps", completedAt: new Date().toISOString(), reward: "+100 XP" },
        { title: "Daily Login", completedAt: new Date().toISOString(), reward: "+50 XP" }
      ],
      dailyCompleted: 2,
      totalDaily: 9
    });
  } catch (error) {
    console.error('Error fetching mission summary:', error);
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
      dailyCompleted: 0,
      totalDaily: 9
    }, { status: 500 });
  }
}
