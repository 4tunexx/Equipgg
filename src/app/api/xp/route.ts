import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase'
import { getLevelInfo, getLevelFromXP, defaultXPConfig, getXPForLevel } from '@/lib/xp-config'

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
