import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createSupabaseQueries, DBAchievement, DBUserAchievement } from '@/lib/supabase/queries';

const queries = createSupabaseQueries(supabase);

interface AchievementCategory {
  name: string;
  achievements: (DBUserAchievement & { achievement: DBAchievement })[];
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

    // Get all user achievements with their details
    const achievements = await queries.getUserAchievements(session.user.id);
    
    if (!achievements) {
      console.error('Error fetching achievements');
      return NextResponse.json(
        { error: 'Failed to fetch achievements' },
        { status: 500 }
      );
    }

    // Group achievements by game type (category)
    const achievementsByCategory = achievements.reduce((acc, achievement) => {
      const gameType = achievement.achievement?.game_type;
      if (!gameType) return acc;

      if (!acc[gameType]) {
        acc[gameType] = {
          name: formatGameType(gameType),
          achievements: []
        };
      }

      acc[gameType].achievements.push({
        ...achievement,
        achievement: achievement.achievement as DBAchievement
      });
      return acc;
    }, {} as Record<string, AchievementCategory>);

    // Get totals
    const totalAchieved = achievements.filter(a => a.unlocked_at).length;
    const totalAchievements = achievements.length;

    return NextResponse.json({
      success: true,
      achievements: achievementsByCategory,
      totalAchieved,
      totalAchievements
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function formatGameType(gameType: string): string {
  // Convert game_type to display name (e.g., 'arcade' -> 'Arcade Games')
  const displayNames: Record<string, string> = {
    arcade: 'Arcade Games',
    betting: 'Betting',
    crash: 'Crash Game',
    coinflip: 'Coin Flip',
    plinko: 'Plinko',
    sweeper: 'Mine Sweeper',
    trading: 'Trading'
  };
  
  return displayNames[gameType] || gameType.charAt(0).toUpperCase() + gameType.slice(1);
}
