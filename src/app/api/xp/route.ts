import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentLevel = user.level || 1
    const currentXP = user.xp || 0
    
    const totalXPForNextLevel = currentLevel * 1000
    const currentLevelXP = currentXP % 1000
    const xpForNextLevel = totalXPForNextLevel - currentLevelXP
    const xpProgress = Math.round((currentLevelXP / 1000) * 100)

    return NextResponse.json({
      success: true,
      xp: currentXP,
      level: currentLevel,
      levelInfo: {
        currentLevel: currentLevel,
        currentXP: currentLevelXP,
        xpForNextLevel: xpForNextLevel,
        xpProgress: xpProgress,
        totalXPForNextLevel: 1000
      }
    })

  } catch (error) {
    console.error('Error fetching XP info:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
