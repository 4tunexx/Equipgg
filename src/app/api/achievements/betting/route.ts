import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    
    if (!session) {
      return createUnauthorizedResponse()
    }
    
    const { matchId, teamId, amount, odds, result } = await request.json()
    
    const userId = session.user_id
    const unlockedAchievements = []
    
    // Define betting achievements
    const bettingAchievements = [
      {
        id: 'first-bet',
        title: 'First Bet',
        description: 'Place your first bet',
        xpReward: 10,
        condition: 'first_bet'
      },
      {
        id: 'bet-winner',
        title: 'Bet Winner',
        description: 'Win your first bet',
        xpReward: 25,
        condition: 'first_win'
      },
      {
        id: 'big-better',
        title: 'Big Better',
        description: 'Place a bet of 500+ coins',
        xpReward: 50,
        condition: 'big_bet'
      },
      {
        id: 'lucky-strike',
        title: 'Lucky Strike',
        description: 'Win a bet with 3x+ odds',
        xpReward: 75,
        condition: 'high_odds_win'
      },
      {
        id: 'betting-streak',
        title: 'Betting Streak',
        description: 'Win 3 bets in a row',
        xpReward: 100,
        condition: 'win_streak'
      },
      {
        id: 'betting-master',
        title: 'Betting Master',
        description: 'Place 50 bets',
        xpReward: 150,
        condition: 'total_bets'
      }
    ]
    
    for (const achievement of bettingAchievements) {
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
      switch (achievement.condition) {
        case 'first_bet':
          if (result === 'placed') shouldUnlock = true
          break
          
        case 'first_win':
          if (result === 'win') shouldUnlock = true
          break
          
        case 'big_bet':
          if (amount >= 500) shouldUnlock = true
          break
          
        case 'high_odds_win':
          if (result === 'win' && odds >= 3) shouldUnlock = true
          break
          
        case 'win_streak':
          if (result === 'win') {
            // Check last 2 bets for streak
            const { data: recentBets, error: recentBetsError } = await supabase
              .from('user_bets')
              .select('result')
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
              .limit(2)

            if (recentBetsError) {
              console.error('Error fetching recent bets:', recentBetsError)
              break
            }
            if (recentBets.length === 2 && recentBets.every(r => r.result === 'win')) {
              shouldUnlock = true
            }
          }
          break
          
        case 'total_bets':
          const { count, error: totalBetsError } = await supabase
            .from('user_bets')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)

          if (totalBetsError) {
            console.error('Error counting total bets:', totalBetsError)
            break
          }
          if (count && count >= 50) shouldUnlock = true
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
    console.error('Betting achievement check error:', error)
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
    
    // Define betting achievements
    const bettingAchievements = [
      {
        id: 'first-bet',
        title: 'First Bet',
        description: 'Place your first bet',
        xpReward: 10
      },
      {
        id: 'bet-winner',
        title: 'Bet Winner',
        description: 'Win your first bet',
        xpReward: 25
      },
      {
        id: 'big-better',
        title: 'Big Better',
        description: 'Place a bet of 500+ coins',
        xpReward: 50
      },
      {
        id: 'lucky-strike',
        title: 'Lucky Strike',
        description: 'Win a bet with 3x+ odds',
        xpReward: 75
      },
      {
        id: 'betting-streak',
        title: 'Betting Streak',
        description: 'Win 3 bets in a row',
        xpReward: 100
      },
      {
        id: 'betting-master',
        title: 'Betting Master',
        description: 'Place 50 bets',
        xpReward: 150
      }
    ]
    
    const achievementsWithStatus = bettingAchievements.map((achievement: any) => ({
      ...achievement,
      unlocked: unlockedIds.includes(achievement.id),
      unlockedAt: unlockedResult.find(r => r.achievement_id === achievement.id)?.unlocked_at
    }))
    
    return NextResponse.json({ achievements: achievementsWithStatus })
    
  } catch (error) {
    console.error('Get betting achievements error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
