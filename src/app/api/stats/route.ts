import { NextResponse } from 'next/server';
import { getDb, getAll, getOne } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    
    // Get real stats from database
    const userCount = await getOne<{count: number}>('SELECT COUNT(*) as count FROM users');
    const betCount = await getOne<{count: number}>('SELECT COUNT(*) as count FROM user_bets');
    const totalCoins = await getOne<{total: number}>('SELECT SUM(coins) as total FROM users');
    const activeUsers = await getOne<{count: number}>('SELECT COUNT(*) as count FROM users WHERE lastLoginAt > datetime("now", "-24 hours")');
    
    const stats = {
      usersOnline: activeUsers?.count || 0,
      totalCoins: totalCoins?.total || 0,
      totalBets: betCount?.count || 0,
      totalUsers: userCount?.count || 0
    };
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}