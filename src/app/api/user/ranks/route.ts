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

    // Get user profile with level and rank info
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    // Get all ranks for progression display
    const { data: allRanks, error: ranksError } = await supabase
      .from('ranks')
      .select('*')
      .eq('is_active', true)
      .order('level_required', { ascending: true })

    if (ranksError) {
      console.error('Error fetching ranks:', ranksError)
    }

    // Determine current rank based on user level
    const userLevel = userProfile?.level || 1
    const currentRank = allRanks?.find(rank => 
      userLevel >= rank.level_required && 
      (!allRanks.find(r => r.level_required > rank.level_required && userLevel >= r.level_required))
    ) || allRanks?.[0]

    // Determine next rank
    const nextRank = allRanks?.find(rank => rank.level_required > userLevel)

    return NextResponse.json({
      success: true,
      user_level: userLevel,
      current_rank: currentRank,
      next_rank: nextRank,
      all_ranks: allRanks || [],
      progress_to_next: nextRank ? {
        current: userLevel,
        required: nextRank.level_required,
        percentage: Math.round((userLevel / nextRank.level_required) * 100)
      } : null
    })

  } catch (error) {
    console.error('Ranks API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}