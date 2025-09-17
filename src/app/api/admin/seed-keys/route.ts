import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-utils';
import { getDb, run, getOne } from '@/lib/db';
import { availableCrates } from '@/lib/mock-data';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await getOne('SELECT role FROM users WHERE id = ?', [session.user_id]);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await getDb();

    // Give all users some keys for each crate
    const users = await getAll('SELECT id FROM users');
    
    for (const user of users) {
      for (const crate of availableCrates) {
        // Check if user already has keys for this crate
        const existingKeys = await getOne(
          'SELECT keys_count FROM user_keys WHERE user_id = ? AND crate_id = ?',
          [user.id, crate.id]
        );

        if (!existingKeys) {
          // Give initial keys based on crate type
          let initialKeys = 0;
          switch (crate.id) {
            case 'level-up':
              initialKeys = 5;
              break;
            case 'loyalty':
              initialKeys = 3;
              break;
            case 'prestige':
              initialKeys = 1;
              break;
            case 'special-occasion':
              initialKeys = 2;
              break;
            case 'event-2025':
              initialKeys = 1;
              break;
            default:
              initialKeys = 2;
          }

          run(`
            INSERT INTO user_keys (id, user_id, crate_id, keys_count, acquired_at)
            VALUES (?, ?, ?, ?, ?)
          `, [
            `${user.id}-${crate.id}`,
            user.id,
            crate.id,
            initialKeys,
            new Date().toISOString()
          ]);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Keys seeded successfully for all users' 
    });

  } catch (error) {
    console.error('Error seeding keys:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
