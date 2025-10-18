import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getAuthSession } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // Get user achievements (just the IDs)
    const { data: userAchievements, error: achievementsError } = await supabase
      .from('user_achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', session.user_id)

    if (achievementsError) {
      console.error('Error fetching user achievements:', achievementsError)
    }

    // Also get all available achievements
    const { data: allAchievements, error: allAchievementsError } = await supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true)
    
    if (allAchievementsError) {
      console.error('Error fetching all achievements:', allAchievementsError)
      return NextResponse.json(
        { error: 'Failed to fetch achievements' },
        { status: 500 }
      )
    }

    // Create a map of user achievements
    const userAchievementIds = new Set((userAchievements || []).map(ua => parseInt(ua.achievement_id)))

    // Combine user achievements with all achievements to show progress
    const allAchievementsWithProgress = (allAchievements || []).map(achievement => ({
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      category: achievement.category || 'General',
      xp_reward: achievement.xp_reward,
      coin_reward: achievement.coin_reward,
      gem_reward: achievement.gem_reward,
      icon_url: achievement.icon_url,
      is_active: achievement.is_active,
      unlocked: userAchievementIds.has(achievement.id),
      progress: userAchievementIds.has(achievement.id) ? 100 : 0
    }))

    // Group achievements by category
    const categorizedAchievements = allAchievementsWithProgress.reduce((acc: any, achievement: any) => {
      const category = achievement.category || 'General'
      if (!acc[category]) {
        acc[category] = {
          name: category,
          achievements: []
        }
      }
      
      acc[category].achievements.push(achievement)
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      achievements: allAchievementsWithProgress,
      categories: Object.values(categorizedAchievements),
      userAchievements: userAchievements || [],
      totalUnlocked: userAchievements?.length || 0,
      totalAchievements: allAchievements?.length || 0
    })

  } catch (error) {
    console.error('Achievements API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}