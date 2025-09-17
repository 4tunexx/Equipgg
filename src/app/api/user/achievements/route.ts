import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-utils';
import { getDb, getAll } from '@/lib/db';
import { achievements } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await getDb();

    if (!session.user_id) {
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 400 });
    }

    // Get user's achievements from database
    const userAchievements = await getAll(`
      SELECT * FROM user_achievements 
      WHERE user_id = ?
      ORDER BY unlocked_at DESC
    `, [session.user_id]);

    // Get all achievements from mock-data and check which ones are achieved
    const allAchievements = [];
    
    // Process each category of achievements
    Object.entries(achievements).forEach(([category, categoryAchievements]) => {
      categoryAchievements.forEach((achievement, index) => {
        const achievementId = `${category.toLowerCase().replace(/\s+/g, '_')}_${index}`;
        allAchievements.push({
          id: achievementId,
          title: achievement.title,
          description: achievement.description,
          category: category,
          icon: getAchievementIcon(category, index),
          achieved: userAchievements.some(a => a.achievement_id === achievementId)
        });
      });
    });

    // Helper function to get appropriate icons for achievements
    function getAchievementIcon(category: string, index: number): string {
      const icons = {
        'Betting': ['🎯', '🏆', '🎲', '💰', '🔥', '⚡', '👑', '🎪', '💎', '🚀', '🌟', '💫', '🎊', '🎉', '🏅'],
        'Economic': ['💵', '💸', '📦', '🛍️', '💎', '🔨', '🎒', '📊', '⚒️', '🎰', '💎', '🔄', '⚔️', '👑'],
        'Progression': ['⭐', '📅', '🏅', '🎯', '🎖️', '📱', '👑', '🏔️', '📈', '🎊', '🔄', '🌟'],
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
