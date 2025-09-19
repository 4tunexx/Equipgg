import { NextRequest, NextResponse } from 'next/server';
import { supabase } from "../../../../lib/supabase";
import { createSupabaseQueries, DBAchievement, DBUserAchievement } from "../../../../lib/supabase/queries";

const queries = createSupabaseQueries(supabase);

interface BettingRequest {
  matchId: string;
  teamId: string;
  amount: number;
  odds: number;
  result: 'win' | 'lose' | 'placed';
}

interface UserBettingAchievement extends Omit<DBUserAchievement, 'progress'> {
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

    const { matchId, teamId, amount, odds, result } = await request.json() as BettingRequest;

    if (!matchId || !teamId || !amount || !odds || result === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Update betting achievements and missions using RPC function
    const { data: progressUpdates, error: progressError } = await supabase.rpc('update_betting_achievements', {
      p_user_id: session.user.id,
      p_match_id: matchId,
      p_team_id: teamId,
      p_amount: amount,
      p_odds: odds,
      p_result: result
    });

    if (progressError) {
      console.error('Error updating betting achievements:', progressError);
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

    // Filter to betting-related achievements
    const bettingAchievements = achievements
      .filter(a => a.achievement?.game_type === 'betting')
      .map(a => ({
        ...a,
        achievement: a.achievement as DBAchievement
      })) as UserBettingAchievement[];

    return NextResponse.json({
      success: true,
      achievements: bettingAchievements,
      progressUpdates
    });
  } catch (error) {
    console.error('Error processing betting achievement:', error);
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

    // Filter to betting-related achievements
    const bettingAchievements = achievements
      .filter(a => a.achievement?.game_type === 'betting')
      .map(a => ({
        ...a,
        achievement: a.achievement as DBAchievement
      })) as UserBettingAchievement[];

    return NextResponse.json({
      success: true,
      achievements: bettingAchievements
    });
  } catch (error) {
    console.error('Error fetching betting achievements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
