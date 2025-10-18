import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getAuthSession } from '@/lib/auth-utils'
import { getLevelFromXP } from '@/lib/xp-config'

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get user data
    const supabase = createServerSupabaseClient();
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user_id)
      .single();
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
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
