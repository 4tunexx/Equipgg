import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getAuthSession } from '@/lib/auth-utils';
import { addXp } from '@/lib/xp-leveling-system';
import { createNotification } from '@/lib/notification-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { achievementId } = await request.json();

    if (!achievementId) {
      return NextResponse.json({ error: 'Achievement ID required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Check if achievement exists
    const { data: achievement, error: achievementError } = await supabase
      .from('achievements')
      .select('*')
      .eq('id', achievementId)
      .single();

    if (achievementError || !achievement) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }

    // Check if user already unlocked this achievement
    const { data: existing, error: checkError } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', session.user_id)
      .eq('achievement_id', achievementId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking user achievement:', checkError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json(
        { error: 'Achievement already claimed' }, 
        { status: 400 }
      );
    }

    // TODO: Check if user actually qualifies for this achievement
    // This would require checking specific conditions based on achievement type

    // Award achievement
    const { error: insertError } = await supabase
      .from('user_achievements')
      .insert({
        user_id: session.user_id,
        achievement_id: achievementId,
        unlocked_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error inserting user achievement:', insertError);
      return NextResponse.json({ error: 'Failed to claim achievement' }, { status: 500 });
    }

    // Award rewards
    let coinsAwarded = 0;
    let gemsAwarded = 0;
    let xpAwarded = 0;

    if (achievement.coin_reward && achievement.coin_reward > 0) {
      const { error: coinsError } = await supabase.rpc('increment_user_coins', {
        p_user_id: session.user_id,
        p_amount: achievement.coin_reward
      });

      if (!coinsError) {
        coinsAwarded = achievement.coin_reward;
      }
    }

    if (achievement.gem_reward && achievement.gem_reward > 0) {
      const { error: gemsError } = await supabase.rpc('increment_user_gems', {
        p_user_id: session.user_id,
        p_amount: achievement.gem_reward
      });

      if (!gemsError) {
        gemsAwarded = achievement.gem_reward;
      }
    }

    if (achievement.xp_reward && achievement.xp_reward > 0) {
      try {
        await addXp(session.user_id, achievement.xp_reward, 'achievement');
        xpAwarded = achievement.xp_reward;
      } catch (error) {
        console.error('Error awarding XP:', error);
      }
    }

    // Create notification
    await createNotification({
      userId: session.user_id,
      type: 'achievement_unlocked',
      title: '🏆 Achievement Unlocked!',
      message: `You unlocked "${achievement.name}"! ${coinsAwarded > 0 ? `+${coinsAwarded} Coins ` : ''}${gemsAwarded > 0 ? `+${gemsAwarded} Gems ` : ''}${xpAwarded > 0 ? `+${xpAwarded} XP` : ''}`,
      data: {
        achievementId,
        achievementName: achievement.name,
        coinsAwarded,
        gemsAwarded,
        xpAwarded
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Achievement claimed!',
      rewards: {
        coins: coinsAwarded,
        gems: gemsAwarded,
        xp: xpAwarded
      }
    });

  } catch (error) {
    console.error('Claim achievement error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

