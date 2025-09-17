import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils'
import { supabase } from '@/lib/supabase/client'
import { dailyMissions } from '@/lib/mock-data'

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    
    if (!session) {
      return createUnauthorizedResponse()
    }
    
    const { gameType, result, multiplier, betAmount, tilesCleared } = await request.json()
    
    const userId = session.user_id
    const unlockedAchievements = []
    
    // Check for arcade-specific achievements
    const arcadeAchievements = dailyMissions.filter((a: any) => a.id.includes('crash') || a.id.includes('coinflip') || a.id.includes('plinko') || a.id.includes('sweeper') || a.id.includes('arcade') || a.id.includes('high-roller'))
    
    for (const achievement of arcadeAchievements) {
      // Check if user already has this achievement
      const { data: existingAchievement, error: existingAchievementError } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_id', achievement.id)
        .maybeSingle()

      if (existingAchievementError) {
        console.error('Error checking existing achievement:', existingAchievementError)
        continue
      }
      
      if (existingAchievement) continue
      
      let shouldUnlock = false
      
      // Check specific achievement conditions
      switch (achievement.id) {
        case 'first-crash':
          if (gameType === 'crash') shouldUnlock = true
          break
          
        case 'crash-cashout-3x':
          if (gameType === 'crash' && result === 'win' && multiplier >= 3) shouldUnlock = true
          break
          
        case 'crash-streak-3':
            if (gameType === 'crash' && result === 'win') {
              // Check last 2 crash games for streak
              const { data: recentCrash, error: recentCrashError } = await supabase
                .from('game_history')
                .select('result')
                .eq('user_id', userId)
                .eq('game_type', 'crash')
                .order('created_at', { ascending: false })
                .limit(2)

              if (recentCrashError) {
                console.error('Error fetching recent crashes:', recentCrashError)
                break
              }

              if (recentCrash.length === 2 && recentCrash.every(r => r.result === 'win')) {
                shouldUnlock = true
              }
            }
            break
          
        case 'coinflip-winner':
          if (gameType === 'coinflip' && result === 'win') shouldUnlock = true
          break
          
        case 'coinflip-streak-5':
            if (gameType === 'coinflip' && result === 'win') {
              const { data: recentFlips, error: recentFlipsError } = await supabase
                .from('game_history')
                .select('result')
                .eq('user_id', userId)
                .eq('game_type', 'coinflip')
                .order('created_at', { ascending: false })
                .limit(4)

              if (recentFlipsError) {
                console.error('Error fetching recent coinflips:', recentFlipsError)
                break
              }

              if (recentFlips.length === 4 && recentFlips.every(r => r.result === 'win')) {
                shouldUnlock = true
              }
            }
            break
          
        case 'plinko-big-win':
          if (gameType === 'plinko' && multiplier >= 10) shouldUnlock = true
          break
          
        case 'sweeper-expert':
          if (gameType === 'sweeper' && tilesCleared >= 10 && result === 'win') shouldUnlock = true
          break
          
        case 'arcade-addict':
            const { count, error: totalGamesError } = await supabase
              .from('game_history')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId)

            if (totalGamesError) {
              console.error('Error counting total games:', totalGamesError)
              break
            }

            if (count && count >= 100) shouldUnlock = true
            break
          
        case 'high-roller':
          if (betAmount >= 1000) shouldUnlock = true
          break
      }
      
      if (shouldUnlock) {
        // Unlock achievement
        const { error: insertError } = await supabase
          .from('user_achievements')
          .insert({ user_id: userId, achievement_id: achievement.id, unlocked_at: new Date().toISOString() })

        if (insertError) {
          console.error('Error unlocking achievement:', insertError)
          continue
        }
        
        // Award XP
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('xp')
          .eq('id', userId)
          .single()

        if (userError) {
          console.error('Error fetching user for XP update:', userError)
          continue
        }

        const { error: updateXpError } = await supabase
          .from('users')
          .update({ xp: user.xp + achievement.xpReward })
          .eq('id', userId)

        if (updateXpError) {
          console.error('Error updating user XP:', updateXpError)
          continue
        }
        
        unlockedAchievements.push({
          id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          xpReward: achievement.xpReward
        })
      }
    }
    
    return NextResponse.json({ unlockedAchievements })
    
  } catch (error) {
    console.error('Achievement check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    
    if (!session) {
      return createUnauthorizedResponse()
    }
    
    const userId = session.user_id
    
    // Get user's unlocked achievements
    const { data: unlockedResult, error: unlockedError } = await supabase
      .from('user_achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', userId)

    if (unlockedError) {
      console.error("Error fetching user's unlocked achievements:", unlockedError)
      return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 })
    }
    
    const unlockedIds = unlockedResult.map(row => row.achievement_id)
    const arcadeAchievements = dailyMissions.filter((a: any) => 
      a.id.includes('crash') || a.id.includes('coinflip') || 
      a.id.includes('plinko') || a.id.includes('sweeper') || 
      a.id.includes('arcade') || a.id.includes('high-roller')
    )
    
    const achievementsWithStatus = arcadeAchievements.map((achievement: any) => ({
      ...achievement,
      unlocked: unlockedIds.includes(achievement.id),
      unlockedAt: unlockedResult.find(r => r.achievement_id === achievement.id)?.unlocked_at
    }))
    
    return NextResponse.json({ achievements: achievementsWithStatus })
    
  } catch (error) {
    console.error('Get achievements error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}