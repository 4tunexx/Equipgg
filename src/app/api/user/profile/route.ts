import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-utils';
import { getDb, getOne, getAll } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await getDb();

    // Get user data
    if (!session.user_id) {
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 400 });
    }

    const user = await getOne(`
      SELECT id, email, displayName, role, coins, gems, xp, level, created_at
      FROM users 
      WHERE id = ?
    `, [session.user_id]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's inventory count
    let itemCount = 0;
    if (session.user_id) {
      const inventoryItems = await getAll(`
        SELECT COUNT(*) as count
        FROM user_inventory 
        WHERE user_id = ?
      `, [session.user_id]);

      itemCount = inventoryItems && inventoryItems.length > 0 ? inventoryItems[0].count : 0;
    }

    // Get user's betting stats (placeholder for now)
    const betsWon = 0; // Will be implemented when betting history is added
    const winRate = 0; // Will be calculated from betting history

    // Get user achievements (placeholder for now)
    const achievements = [];

    // Get user referrals (placeholder for now)  
    const referrals = [];

    return NextResponse.json({
      success: true,
      profile: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          coins: user.coins || 0,
          gems: user.gems || 0,
          xp: user.xp || 0,
          level: user.level || 1,
          createdAt: user.created_at
        },
        stats: {
          itemCount,
          betsWon,
          winRate,
          achievements: achievements.length,
          referrals: referrals.length
        },
        achievements,
        referrals
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
