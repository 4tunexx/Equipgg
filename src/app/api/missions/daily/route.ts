import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { checkAndResetDailyMissions } from '@/lib/mission-integration'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Try to get user from custom session cookie
    const cookieHeader = request.headers.get('cookie') || '';
    const cookieMatch = cookieHeader.match(/equipgg_session=([^;]+)/);
    
    let userId: string | null = null;
    
    if (cookieMatch) {
      try {
        const sessionData = JSON.parse(decodeURIComponent(cookieMatch[1]));
        if (sessionData.user_id && (!sessionData.expires_at || Date.now() < sessionData.expires_at)) {
          userId = sessionData.user_id;
        }
      } catch (e) {
        console.error('Failed to parse session cookie:', e);
      }
    }
    
    // If no custom session, return unauthorized
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // CRITICAL: Check and reset daily missions BEFORE fetching progress
    // This ensures missions are reset every 24 hours
    try {
      console.log(`🔄 Daily missions endpoint - checking reset for user ${userId}`);
      await checkAndResetDailyMissions(userId);
      console.log(`✅ Daily missions reset check completed for user ${userId}`);
    } catch (resetError) {
      console.error('⚠️ Failed to reset daily missions in daily endpoint:', resetError);
      // Continue anyway - don't block mission fetching
    }

    // Get DAILY missions only (filter by mission_type = 'daily')
    // Note: order_index might not exist, so we order by id as fallback
    const { data: missions, error: missionsError } = await supabase
      .from('missions')
      .select('*')
      .eq('is_active', true)
      .eq('mission_type', 'daily')
      .order('id', { ascending: true }) // Use id instead of order_index (which might not exist)

    if (missionsError) {
      console.error('Missions error:', missionsError)
      return NextResponse.json({ error: 'Failed to fetch missions' }, { status: 500 })
    }

    // Get user's mission progress
    const { data: progress, error: progressError } = await supabase
      .from('user_mission_progress')
      .select('*')
      .eq('user_id', userId)

    if (progressError) {
      console.error('Progress error:', progressError)
    }

    // Combine missions with progress
    const missionsWithProgress = missions.map(mission => {
      const userProgress = progress?.find(p => p.mission_id == mission.id) || {
        progress: 0,
        completed: false,
        completed_at: null
      }

      return {
        id: mission.id,
        name: mission.name,
        description: mission.description,
        mission_type: mission.mission_type,
        tier: mission.tier,
        xp_reward: mission.xp_reward,
        coin_reward: mission.coin_reward,
        requirement_type: mission.requirement_type,
        requirement_value: mission.requirement_value,
        is_repeatable: mission.is_repeatable,
        progress: userProgress.progress,
        completed: userProgress.completed,
        completed_at: userProgress.completed_at,
        progress_percentage: Math.min(100, (userProgress.progress / mission.requirement_value) * 100)
      }
    })

    return NextResponse.json({ 
      missions: missionsWithProgress,
      total: missions.length 
    })

  } catch (error) {
    console.error('Daily missions API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}