import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase'
import { getLevelFromXP } from '@/lib/xp-config'

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Calculate level from XP to ensure consistency
    const calculatedLevel = getLevelFromXP(user.xp || 0);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayname || user.name || 'User',
        photoURL: user.avatar_url || '',
        role: user.role || 'user',
        level: calculatedLevel, // Use calculated level from XP
        xp: user.xp || 0,
        coins: user.coins || 0,
        gems: user.gems || 0,
        steam_verified: user.steam_verified || false,
        account_status: user.account_status || 'active'
      }
    })

  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
