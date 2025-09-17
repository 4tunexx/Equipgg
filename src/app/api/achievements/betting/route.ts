import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils'
import { getDb, getAll, getOne, run, persist } from '@/lib/db'

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
      const existingAchievement = await getOne<{ id: number }>(
        'SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
        [userId, achievement.id]
      )
      
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
            const recentBets = await getAll<{ result: string }>(
              'SELECT result FROM user_bets WHERE user_id = ? ORDER BY created_at DESC LIMIT 2',
              [userId]
            )
            if (recentBets.length === 2 && recentBets.every(r => r.result === 'win')) {
              shouldUnlock = true
            }
          }
          break
          
        case 'total_bets':
          const totalBets = await getOne<{ count: number }>(
            'SELECT COUNT(*) as count FROM user_bets WHERE user_id = ?',
            [userId]
          )
          if (totalBets && totalBets.count >= 50) shouldUnlock = true
          break
      }
      
      if (shouldUnlock) {
        // Unlock achievement
        await run(
          'INSERT INTO user_achievements (user_id, achievement_id, unlocked_at) VALUES (?, ?, ?)',
          [userId, achievement.id, new Date().toISOString()]
        )
        
        // Award XP
        await run(
          'UPDATE users SET xp = xp + ? WHERE id = ?',
          [achievement.xpReward, userId]
        )
        
        unlockedAchievements.push({
          id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          xpReward: achievement.xpReward
        })
      }
    }
    
    // Save changes to database file
    persist()
    
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
    const unlockedResult = await getAll<{ achievement_id: string, unlocked_at: string }>(
      'SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = ?',
      [userId]
    )
    
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
