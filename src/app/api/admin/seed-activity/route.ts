import { NextRequest, NextResponse } from 'next/server';
import { getDb, run, getAll } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    await getDb();
    
    // Get some users to create activities for
    const users = await getAll<any>('SELECT id, username, role FROM users LIMIT 5');
    
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'No users found to create activities for' }, { status: 400 });
    }

    const activities = [
      {
        id: uuidv4(),
        user_id: users[0].id,
        username: users[0].username,
        activity_type: 'game_win',
        amount: 2500,
        game_type: 'crash',
        multiplier: 2.5,
        created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString() // 2 minutes ago
      },
      {
        id: uuidv4(),
        user_id: users[1]?.id || users[0].id,
        username: users[1]?.username || users[0].username,
        activity_type: 'crate_open',
        item_name: 'AK-47 | Redline',
        item_rarity: 'Classified',
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 minutes ago
      },
      {
        id: uuidv4(),
        user_id: users[2]?.id || users[0].id,
        username: users[2]?.username || users[0].username,
        activity_type: 'bet_placed',
        amount: 1000,
        game_type: 'coinflip',
        created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString() // 8 minutes ago
      },
      {
        id: uuidv4(),
        user_id: users[3]?.id || users[0].id,
        username: users[3]?.username || users[0].username,
        activity_type: 'achievement_unlock',
        activity_data: JSON.stringify({ achievementName: 'First Win' }),
        created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString() // 12 minutes ago
      },
      {
        id: uuidv4(),
        user_id: users[4]?.id || users[0].id,
        username: users[4]?.username || users[0].username,
        activity_type: 'level_up',
        activity_data: JSON.stringify({ newLevel: 5 }),
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15 minutes ago
      }
    ];

    for (const activity of activities) {
      run(`
        INSERT OR REPLACE INTO user_activity_feed (
          id, user_id, username, activity_type, activity_data, amount, 
          item_name, item_rarity, game_type, multiplier, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        activity.id,
        activity.user_id,
        activity.username,
        activity.activity_type,
        activity.activity_data || null,
        activity.amount || null,
        activity.item_name || null,
        activity.item_rarity || null,
        activity.game_type || null,
        activity.multiplier || null,
        activity.created_at
      ]);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Activity data seeded successfully',
      count: activities.length
    });

  } catch (error) {
    console.error('Error seeding activity data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
