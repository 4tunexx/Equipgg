import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';
import { getDb, getOne, run } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session || session.role !== 'admin') {
      return createUnauthorizedResponse();
    }

    const db = await getDb();
    
    // Get admin user
    const user = await getOne('SELECT id, level, coins FROM users WHERE email = ?', ['admin@example.com']);
    if (!user) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }
    
    const userId = user.id;
    console.log('Giving level 2 rewards to user:', userId, 'Current level:', user.level);
    
    if (user.level >= 2) {
      // Give level-up crate key
      const existingKey = await getOne(
        'SELECT keys_count FROM user_keys WHERE user_id = ? AND crate_id = ?',
        [userId, 'level-up']
      );

      if (existingKey) {
        // Update existing key count
        await run(
          'UPDATE user_keys SET keys_count = keys_count + 1 WHERE user_id = ? AND crate_id = ?',
          [userId, 'level-up']
        );
        console.log('Updated existing level-up key count');
      } else {
        // Create new key entry
        await run(
          `INSERT INTO user_keys (id, user_id, crate_id, keys_count, acquired_at)
           VALUES (?, ?, ?, ?, ?)`,
          [
            `${userId}-level-up`,
            userId,
            'level-up',
            1,
            new Date().toISOString()
          ]
        );
        console.log('Created new level-up key entry');
      }

      // Create level up notification
      await run(
        `INSERT INTO notifications (id, user_id, type, title, message, data, created_at, read)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `levelup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          'level_up',
          '⭐ Level Up!',
          `Congratulations! You reached Level 2! You received 200 coins and 1 Level-Up Crate Key!`,
          JSON.stringify({ level: 2, rewards: { coins: 200, keys: 1 } }),
          new Date().toISOString(),
          0
        ]
      );
      console.log('Created level-up notification');
      
      // Give level-up bonus coins
      await run(
        'UPDATE users SET coins = coins + 200 WHERE id = ?',
        [userId]
      );
      console.log('Added 200 level-up bonus coins');
      
      // Record the transaction
      await run(
        `INSERT INTO user_transactions (id, user_id, type, amount, currency, description, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          `levelup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          'level_bonus',
          200,
          'coins',
          'Level 2 bonus (+200 coins)',
          new Date().toISOString()
        ]
      );
      console.log('Recorded level-up transaction');
      
      return NextResponse.json({
        success: true,
        message: 'Level 2 rewards given successfully!',
        rewards: {
          coins: 200,
          keys: 1
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `User is not level 2 yet, current level: ${user.level}`
      });
    }
    
  } catch (error) {
    console.error('Error giving level 2 rewards:', error);
    return NextResponse.json({ error: 'Failed to give level 2 rewards' }, { status: 500 });
  }
}

