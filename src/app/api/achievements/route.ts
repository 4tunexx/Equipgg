import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createServerSupabaseClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // Get user's achievements from database
    const { data: userAchievements, error: achievementsError } = await supabase
      .from('user_achievements')
      .select('*, achievements(*)')
      .eq('user_id', user.id)

    if (achievementsError) {
      console.error('Achievements error:', achievementsError)
    }

    // Get all available achievements
    const { data: allAchievements, error: allAchievementsError } = await supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true)

    if (allAchievementsError) {
      console.error('All achievements error:', allAchievementsError)
      return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 })
    }

    return NextResponse.json({
      userAchievements: userAchievements || [],
      allAchievements: allAchievements || [],
      totalUnlocked: userAchievements?.length || 0,
      totalAchievements: allAchievements?.length || 0
    });

  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { achievementId } = await request.json();
    
    if (!achievementId) {
      return NextResponse.json(
        { error: 'Achievement ID is required' },
        { status: 400 }
      );
    }

    // For demo purposes, just return success
    return NextResponse.json({ 
      success: true,
      message: 'Achievement unlocked!'
    });

  } catch (error) {
    console.error('Error completing achievement:', error);
    return NextResponse.json(
      { error: 'Failed to complete achievement' },
      { status: 500 }
    );
  }
}