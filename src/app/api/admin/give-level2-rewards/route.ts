import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';
import { secureDb } from '@/lib/secure-db';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session || session.role !== 'admin') {
      return createUnauthorizedResponse();
    }

    // Get admin user
    const user = await secureDb.findOne('users', { email: 'admin@example.com' });
    if (!user) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }
    const userId = user.id;
    console.log('Giving level 2 rewards to user:', userId, 'Current level:', user.level);
    if (user.level >= 2) {
      // Give level-up crate key
      const existingKey = await secureDb.findOne('user_keys', { user_id: userId, crate_id: 'level-up' });
      if (existingKey) {
        await secureDb.update('user_keys', { user_id: userId, crate_id: 'level-up' }, { keys_count: (existingKey.keys_count || 0) + 1 });
        console.log('Updated existing level-up key count');
      } else {
        await secureDb.create('user_keys', {
          id: `${userId}-level-up`,
          user_id: userId,
          crate_id: 'level-up',
          keys_count: 1,
          acquired_at: new Date().toISOString()
        });
        console.log('Created new level-up key entry');
      }
      // Create level up notification
      await secureDb.create('notifications', {
        id: `levelup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        type: 'level_up',
        title: '⭐ Level Up!',
        message: 'Congratulations! You reached Level 2! You received 200 coins and 1 Level-Up Crate Key!',
        data: JSON.stringify({ level: 2, rewards: { coins: 200, keys: 1 } }),
        created_at: new Date().toISOString(),
        read: 0
      });
      console.log('Created level-up notification');
      // Give level-up bonus coins
      await secureDb.update('users', { id: userId }, { coins: (user.coins || 0) + 200 });
      console.log('Added 200 level-up bonus coins');
      // Record the transaction
      await secureDb.create('user_transactions', {
        id: `levelup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        type: 'level_bonus',
        amount: 200,
        currency: 'coins',
        description: 'Level 2 bonus (+200 coins)',
        created_at: new Date().toISOString()
      });
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

