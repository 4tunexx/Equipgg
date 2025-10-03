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

    // Get all achievements
    const { data: allAchievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('xp_reward', { ascending: false })

    if (achievementsError) {
      console.error('Achievements error:', achievementsError)
      return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 })
    }

    // Get user's unlocked achievements
    const { data: userAchievements, error: userAchievementsError } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user.id)

    if (userAchievementsError) {
      console.error('User achievements error:', userAchievementsError)
    }

    // Get all badges
    const { data: allBadges, error: badgesError } = await supabase
      .from('badges')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('rarity', { ascending: true })

    if (badgesError) {
      console.error('Badges error:', badgesError)
    }

    // Get user's earned badges
    const { data: userBadges, error: userBadgesError } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', user.id)

    if (userBadgesError) {
      console.error('User badges error:', userBadgesError)
    }

    // Get all ranks
    const { data: allRanks, error: ranksError } = await supabase
      .from('ranks')
      .select('*')
      .order('rank_number', { ascending: true })

    if (ranksError) {
      console.error('Ranks error:', ranksError)
    }

    // Get user data for current level/rank
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('level, xp')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('User data error:', userError)
    }

    // Add unlocked status to achievements
    const achievementsWithStatus = allAchievements.map(achievement => ({
      ...achievement,
      unlocked: userAchievements?.some(ua => ua.achievement_id === achievement.id.toString()) || false,
      unlocked_at: userAchievements?.find(ua => ua.achievement_id === achievement.id.toString())?.unlocked_at || null
    }))

    // Add earned status to badges
    const badgesWithStatus = allBadges?.map(badge => ({
      ...badge,
      earned: userBadges?.some(ub => ub.badge_id === badge.id) || false,
      earned_at: userBadges?.find(ub => ub.badge_id === badge.id)?.earned_at || null
    })) || []

    // Add unlocked status to ranks based on user level
    const userLevel = userData?.level || 1
    const ranksWithStatus = allRanks?.map(rank => ({
      ...rank,
      unlocked: userLevel >= rank.min_level,
      current: userLevel >= rank.min_level && userLevel <= rank.max_level
    })) || []

    return NextResponse.json({ 
      achievements: achievementsWithStatus,
      badges: badgesWithStatus,
      ranks: ranksWithStatus,
      user_level: userLevel,
      user_xp: userData?.xp || 0,
      stats: {
        total_achievements: allAchievements.length,
        unlocked_achievements: userAchievements?.length || 0,
        total_badges: allBadges?.length || 0,
        earned_badges: userBadges?.length || 0,
        total_ranks: allRanks?.length || 0,
        unlocked_ranks: ranksWithStatus.filter(r => r.unlocked).length
      }
    })

  } catch (error) {
    console.error('Profile achievements API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}