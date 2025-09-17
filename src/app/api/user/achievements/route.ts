import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { achievements } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  try {
    // Get Supabase Auth session from cookie (client should send access_token in header or cookie)
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Get user from Supabase Auth
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Get user's achievements from Supabase
    const { data: userAchievements, error: achError } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user.id)
      .order('unlocked_at', { ascending: false });
    if (achError) {
      return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
    }
    // Get all achievements from mock-data and check which ones are achieved
    const allAchievements: any[] = [];
    Object.entries(achievements).forEach(([category, categoryAchievements]) => {
      categoryAchievements.forEach((achievement, index) => {
        const achievementId = `${category.toLowerCase().replace(/\s+/g, '_')}_${index}`;
        allAchievements.push({
          id: achievementId,
          title: achievement.title,
          description: achievement.description,
          category: category,
          icon: getAchievementIcon(category, index),
          achieved: (userAchievements || []).some(a => a.achievement_id === achievementId)
        });
      });
    });
    function getAchievementIcon(category: string, index: number): string {
      const icons = {
        'Betting': ['�', '🏆', '🎲', '💰', '🔥', '⚡', '👑', '🎪', '💎', '🚀', '🌟', '💫', '🎊', '🎉', '🏅'],
        'Economic': ['💵', '💸', '📦', '🛍️', '💎', '🔨', '🎒', '📊', '⚒️', '🎰', '💎', '🔄', '⚔️', '👑'],
        'Progression': ['⭐', '📅', '🏅', '�', '�️', '📱', '👑', '🏔️', '📈', '🎊', '🔄', '🌟'],
        'Social & Community': ['💬', '🎨', '📝', '👥', '🏆', '📚', '📖', '🍽️', '🎭']
      };
      return icons[category]?.[index] || '🏆';
    }
    // Group achievements by category
    const achievementsByCategory = allAchievements.reduce((acc, achievement) => {
      if (!acc[achievement.category]) {
        acc[achievement.category] = [];
      }
      acc[achievement.category].push(achievement);
      return acc;
    }, {} as Record<string, typeof allAchievements>);
    return NextResponse.json({
      success: true,
      achievements: achievementsByCategory,
      totalAchieved: allAchievements.filter(a => a.achieved).length,
      totalAchievements: allAchievements.length
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
