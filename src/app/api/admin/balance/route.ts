import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-utils';
import { getDb, getOne, run } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const user = await getOne<{ coins: number; gems: number }>(
      'SELECT coins, gems FROM users WHERE id = ?',
      [session.user_id]
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      coins: user.coins,
      gems: user.gems
    });
  } catch (error) {
    console.error('Error fetching admin balance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { coins, gems } = await request.json();

    if (typeof coins !== 'number' || typeof gems !== 'number') {
      return NextResponse.json({ error: 'Invalid coins or gems value' }, { status: 400 });
    }

    if (coins < 0 || gems < 0) {
      return NextResponse.json({ error: 'Coins and gems cannot be negative' }, { status: 400 });
    }

    const db = await getDb();
    
    // Update user's balance
    await run(
      'UPDATE users SET coins = ?, gems = ? WHERE id = ?',
      [coins, gems, session.user_id]
    );

    return NextResponse.json({
      success: true,
      message: 'Balance updated successfully',
      coins,
      gems
    });
  } catch (error) {
    console.error('Error updating admin balance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
