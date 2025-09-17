import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils'
import { getDb, getAll, getOne, run, persist } from '@/lib/db'
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
      const existingAchievement = await getOne<{ id: number }>(
        'SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
        [userId, achievement.id]
      )
      
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
              const recentCrash = await getAll<{ result: string }>(
                'SELECT result FROM game_history WHERE user_id = ? AND game_type = ? ORDER BY created_at DESC LIMIT 2',
                [userId, 'crash']
              )
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
              const recentFlips = await getAll<{ result: string }>(
                'SELECT result FROM game_history WHERE user_id = ? AND game_type = ? ORDER BY created_at DESC LIMIT 4',
                [userId, 'coinflip']
              )
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
            const totalGames = await getOne<{ count: number }>(
              'SELECT COUNT(*) as count FROM game_history WHERE user_id = ?',
              [userId]
            )
            if (totalGames && totalGames.count >= 100) shouldUnlock = true
            break
          
        case 'high-roller':
          if (betAmount >= 1000) shouldUnlock = true
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
    const unlockedResult = await getAll<{ achievement_id: string, unlocked_at: string }>(
      'SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = ?',
      [userId]
    )
    
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