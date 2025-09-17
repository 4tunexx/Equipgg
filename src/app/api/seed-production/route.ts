import { NextRequest, NextResponse } from 'next/server';
import { getDb, run } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    await getDb();
    
    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const moderatorPassword = await bcrypt.hash('moderator123', 10);
    const testPassword = await bcrypt.hash('test123', 10);
    
    // Create users table if it doesn't exist
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        displayName TEXT,
        avatar_url TEXT,
        role TEXT DEFAULT 'user',
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        coins INTEGER DEFAULT 0,
        gems INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        lastLoginAt TIMESTAMP
      )
    `);
    
    // Create sessions table if it doesn't exist
    await run(`
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert default users
    const users = [
      {
        id: 'admin-123-456-789',
        email: 'admin@equipgg.net',
        password_hash: adminPassword,
        displayName: 'Admin User',
        role: 'admin',
        xp: 0,
        level: 1,
        coins: 0,
        gems: 50
      },
      {
        id: 'moderator-123-456-789',
        email: 'moderator@equipgg.net',
        password_hash: moderatorPassword,
        displayName: 'Moderator User',
        role: 'moderator',
        xp: 0,
        level: 1,
        coins: 0,
        gems: 25
      },
      {
        id: 'test-123-456-789',
        email: 'test@equipgg.net',
        password_hash: testPassword,
        displayName: 'Test User',
        role: 'user',
        xp: 0,
        level: 1,
        coins: 1000,
        gems: 10
      }
    ];
    
    const createdUsers = [];
    
    for (const user of users) {
      try {
        await run(`
          INSERT OR REPLACE INTO users 
          (id, email, password_hash, displayName, role, xp, level, coins, gems, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
          user.id,
          user.email,
          user.password_hash,
          user.displayName,
          user.role,
          user.xp,
          user.level,
          user.coins,
          user.gems
        ]);
        createdUsers.push(user.email);
      } catch (error) {
        console.log(`User ${user.email} already exists or error:`, error);
      }
    }
    
    // Persist database changes
    const db = await getDb();
    await db.export();
    
    return NextResponse.json({
      success: true,
      message: 'Production users created successfully',
      users: createdUsers
    });
    
  } catch (error) {
    console.error('Error creating production users:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
