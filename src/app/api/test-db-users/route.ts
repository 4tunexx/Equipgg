import { NextRequest, NextResponse } from 'next/server';
import { getDb, getOne, getAll } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    await getDb();
    
    // Check if users table exists and has data
    const users = await getAll('SELECT id, email, displayName, role FROM users LIMIT 5');
    
    return NextResponse.json({
      success: true,
      userCount: users.length,
      users: users
    });
    
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
