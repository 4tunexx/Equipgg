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
      // Return default profile data instead of 404
      return NextResponse.json({
        success: true,
        user: {
          id: session.user_id,
          email: '',
          displayName: 'User',
          photoURL: '',
          role: 'user',
          level: 1,
          xp: 0,
          coins: 0,
          gems: 0,
          steam_verified: false,
          account_status: 'active',
          rank: null
        },
        profile: {
          user: {
            displayName: 'User'
          },
          stats: {
            itemCount: 0,
            betsWon: 0,
            winRate: 0
          }
        }
      });
    }

    // Calculate level from XP to ensure consistency
    const calculatedLevel = getLevelFromXP(user.xp || 0);

    // Get user's current rank based on level
    const { data: rank } = await supabase
      .from('ranks')
      .select('*')
      .lte('min_level', calculatedLevel)
      .or(`max_level.gte.${calculatedLevel},max_level.is.null`)
      .eq('is_active', true)
      .order('min_level', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get user stats - sum quantities for stacked items
    const { data: inventoryData } = await supabase
      .from('user_inventory')
      .select('quantity')
      .eq('user_id', session.user_id);

    const itemCount = inventoryData?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

    const { data: betStats } = await supabase
      .from('user_bets')
      .select('status')
      .eq('user_id', session.user_id);

    const betsWon = betStats?.filter(b => b.status === 'won').length || 0;
    const totalBets = betStats?.length || 0;
    const winRate = totalBets > 0 ? Math.round((betsWon / totalBets) * 100) : 0;

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
        account_status: user.account_status || 'active',
        rank: rank ? {
          id: rank.id,
          name: rank.name,
          tier: rank.tier,
          icon_url: rank.icon_url,
          prestige_icon_url: rank.prestige_icon_url
        } : null
      },
      profile: {
        user: {
          displayName: user.displayname || user.name || 'User'
        },
        stats: {
          itemCount: itemCount || 0,
          betsWon: betsWon,
          winRate: winRate
        }
      }
    })

  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
