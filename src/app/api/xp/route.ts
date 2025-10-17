import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getLevelInfo, getLevelFromXP, defaultXPConfig, getXPForLevel } from '@/lib/xp-config'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
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
    
    if (!userId) {
      // Return default XP data instead of 401 - prevents errors on dashboard
      return NextResponse.json({
        success: true,
        xp: 0,
        level: 1,
        levelInfo: {
          currentLevel: 1,
          currentLevelXP: 100,
          totalXPNeeded: 0,
          xpToNext: 100,
          progressPercent: 0,
          currentXP: 0,
          xpForNextLevel: 100,
          xpProgress: 0,
          totalXPForNextLevel: 100
        }
      })
    }

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('xp')
      .eq('id', userId)
      .single();
    
    if (userError || !user) {
      // Return default data instead of 404
      return NextResponse.json({
        success: true,
        xp: 0,
        level: 1,
        levelInfo: {
          currentLevel: 1,
          currentLevelXP: 100,
          totalXPNeeded: 0,
          xpToNext: 100,
          progressPercent: 0,
          currentXP: 0,
          xpForNextLevel: 100,
          xpProgress: 0,
          totalXPForNextLevel: 100
        }
      })
    }

    const currentXP = user.xp || 0
    const levelInfo = getLevelInfo(currentXP, defaultXPConfig)

    return NextResponse.json({
      success: true,
      xp: currentXP,
      level: levelInfo.level,
      levelInfo: {
        currentLevel: levelInfo.level,
        currentLevelXP: levelInfo.currentLevelXP,
        totalXPNeeded: levelInfo.totalXPNeeded,
        xpToNext: levelInfo.xpToNext,
        progressPercent: levelInfo.progressPercent,
        // For backwards compatibility with frontend components
        currentXP: Math.max(0, currentXP - levelInfo.totalXPNeeded),
        xpForNextLevel: levelInfo.xpToNext,
        xpProgress: levelInfo.progressPercent,
        totalXPForNextLevel: levelInfo.currentLevelXP
      }
    })

  } catch (error) {
    console.error('Error fetching XP info:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
