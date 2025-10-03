import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user achievements with achievement details
    const { data: userAchievements, error: achievementsError } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievements!inner (
          id,
          name,
          description,
          category,
          xp_reward,
          coin_reward,
          gem_reward,
          icon_url,
          is_active
        )
      `)
      .eq('user_id', user.id)
    
    if (achievementsError) {
      console.error('Error fetching achievements:', achievementsError)
      return NextResponse.json(
        { error: 'Failed to fetch achievements' },
        { status: 500 }
      )
    }

    // Group achievements by category
    const categorizedAchievements = (userAchievements || []).reduce((acc: any, userAchievement: any) => {
      const achievement = userAchievement.achievements
      if (!achievement || !achievement.is_active) return acc
      
      const category = achievement.category || 'General'
      if (!acc[category]) {
        acc[category] = {
          name: category,
          achievements: []
        }
      }
      
      acc[category].achievements.push({
        ...userAchievement,
        achievement: achievement
      })
      
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      categories: Object.values(categorizedAchievements),
      total: userAchievements?.length || 0
    })

  } catch (error) {
    console.error('Achievements API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}