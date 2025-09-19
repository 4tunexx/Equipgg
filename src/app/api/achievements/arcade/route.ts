import { NextRequest, NextResponse } from 'next/server';
import { supabase } from "../../../../lib/supabase";
import { createSupabaseQueries, DBAchievement, DBUserAchievement, GameType } from "../../../../lib/supabase/queries";

const queries = createSupabaseQueries(supabase);

interface ArcadeGameRequest {
  gameType: GameType;
  result: 'win' | 'lose' | 'placed';
  multiplier?: number;
  betAmount?: number;
  tilesCleared?: number;
}

interface UserArcadeAchievement extends Omit<DBUserAchievement, 'progress'> {
  achievement: DBAchievement;
  unlocked_at: string;
  progress: number | null;
}

export async function POST(request: NextRequest) {
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { gameType, result, multiplier, betAmount, tilesCleared } = await request.json() as ArcadeGameRequest;

    if (!gameType || result === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Update arcade achievements and missions using RPC function
    const { data: progressUpdates, error: progressError } = await supabase.rpc('update_arcade_achievements', {
      p_user_id: session.user.id,
      p_game_type: gameType,
      p_result: result,
      p_multiplier: multiplier || 0,
      p_bet_amount: betAmount || 0,
      p_tiles_cleared: tilesCleared || 0
    });

    if (progressError) {
      console.error('Error updating arcade achievements:', progressError);
      return NextResponse.json(
        { error: 'Failed to update achievements' },
        { status: 500 }
      );
    }

    // Get updated achievements for the user
    const achievements = await queries.getUserAchievements(session.user.id);
    
    if (!achievements) {
      console.error('Error fetching updated achievements');
      return NextResponse.json(
        { error: 'Failed to fetch updated achievements' },
        { status: 500 }
      );
    }

    // Filter achievements by game type
    const arcadeAchievements = achievements
      .filter(a => a.achievement?.game_type === gameType)
      .map(a => ({
        ...a,
        achievement: a.achievement as DBAchievement
      })) as UserArcadeAchievement[];

    return NextResponse.json({
      success: true,
      achievements: arcadeAchievements,
      progressUpdates
    });
  } catch (error) {
    console.error('Error processing arcade achievement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user achievements
    const achievements = await queries.getUserAchievements(session.user.id);
    
    if (!achievements) {
      console.error('Error fetching achievements');
      return NextResponse.json(
        { error: 'Failed to fetch achievements' },
        { status: 500 }
      );
    }

    // Filter to only arcade-related achievements
    const arcadeAchievements = achievements
      .filter(a => a.achievement && ['arcade', 'crash', 'coinflip', 'plinko', 'sweeper'].includes(a.achievement.game_type))
      .map(a => ({
        ...a,
        achievement: a.achievement as DBAchievement
      })) as UserArcadeAchievement[];

    return NextResponse.json({
      success: true,
      achievements: arcadeAchievements
    });
  } catch (error) {
    console.error('Error fetching arcade achievements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}