import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-utils';
import { getDb, run } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    await getDb();

    // Test user credentials
    const testUsers = [
      {
        email: 'admin@example.com',
        password: 'admin123',
        displayName: 'Admin User',
        role: 'admin'
      },
      {
        email: 'mod@example.com',
        password: 'mod123',
        displayName: 'Moderator',
        role: 'moderator'
      },
      {
        email: 'user@example.com',
        password: 'password123',
        displayName: 'Normal User',
        role: 'user'
      }
    ];

    const results = [];

    for (const userData of testUsers) {
      try {
        // Check if user already exists
        const existingUser = await getDb().then(db => {
          const stmt = db.prepare('SELECT id FROM users WHERE email = ?');
          stmt.bind([userData.email]);
          return stmt.step() ? stmt.getAsObject() : null;
        });

        if (existingUser) {
          results.push({ email: userData.email, status: 'already exists' });
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        // Create user
        const userId = uuidv4();
        const timestamp = new Date().toISOString();
        run(`
          INSERT INTO users (id, email, password_hash, displayName, role, coins, gems, xp, level, created_at, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          userId,
          userData.email,
          hashedPassword,
          userData.displayName,
          userData.role,
          0, // coins
          0, // gems
          0, // xp
          1, // level
          timestamp,
          timestamp
        ]);

        results.push({ email: userData.email, status: 'created' });
      } catch (error) {
        console.error(`Error creating user ${userData.email}:`, error);
        results.push({ email: userData.email, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    // Also seed some initial keys for all users
    const users = [
      { id: 'admin-user', role: 'admin' },
      { id: 'mod-user', role: 'moderator' },
      { id: 'user-1', role: 'user' },
      { id: 'user-2', role: 'user' },
      { id: 'user-3', role: 'user' }
    ];

    const crates = [
      { id: 'level-up', keys: 5 },
      { id: 'loyalty', keys: 3 },
      { id: 'prestige', keys: 1 },
      { id: 'special-occasion', keys: 2 },
      { id: 'event-2025', keys: 1 }
    ];

    for (const user of users) {
      for (const crate of crates) {
        run(`
          INSERT OR REPLACE INTO user_keys (id, user_id, crate_id, keys_count, acquired_at)
          VALUES (?, ?, ?, ?, ?)
        `, [
          `${user.id}-${crate.id}`,
          user.id,
          crate.id,
          crate.keys,
          new Date().toISOString()
        ]);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Test users and keys created successfully',
      results
    });

  } catch (error) {
    console.error('Error seeding users:', error);
    return NextResponse.json({ error: 'Failed to seed users' }, { status: 500 });
  }
}
