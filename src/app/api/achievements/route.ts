import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createSupabaseQueries } from '@/lib/supabase/queries';

const queries = createSupabaseQueries(supabase);

export async function GET(request: NextRequest) {
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's achievements
    const achievements = await queries.getUserAchievements(session.user.id);
    
    // Get active missions
    const missions = await queries.getUserMissions(session.user.id);
    
    // Split missions by type
    const dailyMissions = missions.filter(m => m.mission?.type === 'daily');
    const weeklyMissions = missions.filter(m => m.mission?.type === 'weekly');
    const mainMissions = missions.filter(m => m.mission?.type === 'main');
    const eventMissions = missions.filter(m => m.mission?.type === 'event');

    return NextResponse.json({
      achievements,
      missions: {
        daily: dailyMissions,
        weekly: weeklyMissions,
        main: mainMissions,
        event: eventMissions
      }
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
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
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

    // Complete achievement using RPC function
    await queries.completeAchievement(session.user.id, achievementId);

    return NextResponse.json({ 
      success: true,
      message: 'Achievement completed successfully'
    });
  } catch (error) {
    console.error('Error completing achievement:', error);
    return NextResponse.json(
      { error: 'Failed to complete achievement' },
      { status: 500 }
    );
  }
}