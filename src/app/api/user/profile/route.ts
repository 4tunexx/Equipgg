import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "@/lib/supabase";

// GET /api/user/profile - Get user's profile information  
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile data
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
      // Return default profile data
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.email?.split('@')[0] || 'Anonymous',
          role: 'user',
          coins: 0,
          gems: 0,
          xp: 0,
          level: 1,
          rank: null,
          createdAt: new Date().toISOString()
        },
        stats: {
          itemCount: 0,
          betsWon: 0,
          winRate: 0,
          achievements: 0,
          referrals: 0
        },
        achievements: [],
        referrals: []
      })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: profileData.display_name || user.email?.split('@')[0] || 'Anonymous',
        role: profileData.role || 'user',
        coins: profileData.coins || 0,
        gems: profileData.gems || 0,
        xp: profileData.xp || 0,
        level: profileData.level || 1,
        rank: null, // TODO: implement rank system
        createdAt: profileData.created_at || new Date().toISOString()
      },
      stats: {
        itemCount: 0,
        betsWon: 0,
        winRate: 0,
        achievements: 0,
        referrals: 0
      },
      achievements: [],
      referrals: []
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
