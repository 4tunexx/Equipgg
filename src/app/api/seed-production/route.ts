import { NextRequest, NextResponse } from 'next/server';
import { secureDb } from "../../../lib/secure-db";
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const moderatorPassword = await bcrypt.hash('moderator123', 10);
    const testPassword = await bcrypt.hash('test123', 10);
    
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
    
    const createdUsers: string[] = [];
    
    for (const user of users) {
      try {
        await secureDb.create('users', {
          ...user,
          created_at: new Date().toISOString(),
        });
        createdUsers.push(user.email);
      } catch (error) {
        console.log(`User ${user.email} already exists or error:`, error);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Production users created successfully',
      users: createdUsers
    });
    
  } catch (error) {
    console.error('Error creating production users:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
