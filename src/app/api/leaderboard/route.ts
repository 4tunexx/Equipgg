import { NextResponse } from 'next/server';
import { getDb, getAll } from '@/lib/db';

export async function GET() {
  try {
    await getDb();
    
    // Get top players by XP
    const players = await getAll(`
      SELECT 
        id,
        displayName as name,
        xp,
        level,
        avatar_url as avatar,
        role,
        ROW_NUMBER() OVER (ORDER BY xp DESC, level DESC) as rank
      FROM users 
      ORDER BY xp DESC, level DESC 
      LIMIT 50
    `);

    return NextResponse.json(players);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}