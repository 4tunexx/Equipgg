import { NextRequest, NextResponse } from 'next/server';
import { getDb, run } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const now = new Date().toISOString();

    // Create admin user
    const adminId = 'admin-123-456-789';
    const adminPassword = 'admin123';
    const adminHashedPassword = bcrypt.hashSync(adminPassword, 10);

    try {
      await run(`
        INSERT INTO users (
          id, email, password_hash, displayName, role, xp, level, 
          coins, gems, created_at, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        adminId, 'admin@example.com', adminHashedPassword, 'Admin User', 'admin',
        0, 1, 0, 50, now, now
      ]);
      console.log('✅ Admin user created');
    } catch (error) {
      console.log('Admin user already exists or error:', error);
    }

    // Create moderator user
    const moderatorId = 'moderator-123-456-789';
    const moderatorPassword = 'moderator123';
    const moderatorHashedPassword = bcrypt.hashSync(moderatorPassword, 10);

    try {
      await run(`
        INSERT INTO users (
          id, email, password_hash, displayName, role, xp, level, 
          coins, gems, created_at, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        moderatorId, 'moderator@example.com', moderatorHashedPassword, 'Moderator User', 'moderator',
        0, 1, 0, 25, now, now
      ]);
      console.log('✅ Moderator user created');
    } catch (error) {
      console.log('Moderator user already exists or error:', error);
    }

    // Create test user
    const testId = 'test-123-456-789';
    const testPassword = 'test123';
    const testHashedPassword = bcrypt.hashSync(testPassword, 10);

    try {
      await run(`
        INSERT INTO users (
          id, email, password_hash, displayName, role, xp, level, 
          coins, gems, created_at, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        testId, 'test@example.com', testHashedPassword, 'Test User', 'user',
        0, 1, 1000, 10, now, now
      ]);
      console.log('✅ Test user created');
    } catch (error) {
      console.log('Test user already exists or error:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Users created successfully',
      users: {
        admin: { email: 'admin@example.com', password: 'admin123' },
        moderator: { email: 'moderator@example.com', password: 'moderator123' },
        test: { email: 'test@example.com', password: 'test123' }
      }
    });

  } catch (error) {
    console.error('Error creating users:', error);
    return NextResponse.json({ 
      error: 'Failed to create users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
