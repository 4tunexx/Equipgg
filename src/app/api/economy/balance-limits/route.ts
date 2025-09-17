import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-utils';
import { getDb, getOne } from '@/lib/db';

// Economy balance limits to prevent inflation
const BALANCE_LIMITS = {
  coins: {
    dailyEarn: 50000,    // Max coins earned per day
    maxBalance: 1000000, // Max coins a user can hold
    levelMultiplier: 1.2 // Multiplier based on user level
  },
  gems: {
    dailyEarn: 100,      // Max gems earned per day (from missions/achievements)
    maxBalance: 10000,   // Max gems a user can hold
    levelMultiplier: 1.1
  },
  xp: {
    dailyEarn: 10000,    // Max XP earned per day
    levelMultiplier: 1.5
  }
};

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await getDb();

    // Get user's current stats
    const user = await getOne(
      'SELECT id, level, coins, gems, xp FROM users WHERE id = ?',
      [session.user_id]
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate limits based on user level
    const levelMultiplier = Math.pow(BALANCE_LIMITS.coins.levelMultiplier, user.level - 1);
    
    const userLimits = {
      coins: {
        dailyEarn: Math.floor(BALANCE_LIMITS.coins.dailyEarn * levelMultiplier),
        maxBalance: Math.floor(BALANCE_LIMITS.coins.maxBalance * levelMultiplier),
        current: user.coins,
        canEarn: Math.floor(BALANCE_LIMITS.coins.dailyEarn * levelMultiplier) // Will be calculated based on daily activity
      },
      gems: {
        dailyEarn: Math.floor(BALANCE_LIMITS.gems.dailyEarn * levelMultiplier),
        maxBalance: Math.floor(BALANCE_LIMITS.gems.maxBalance * levelMultiplier),
        current: user.gems,
        canEarn: Math.floor(BALANCE_LIMITS.gems.dailyEarn * levelMultiplier)
      },
      xp: {
        dailyEarn: Math.floor(BALANCE_LIMITS.xp.dailyEarn * levelMultiplier),
        current: user.xp,
        canEarn: Math.floor(BALANCE_LIMITS.xp.dailyEarn * levelMultiplier)
      }
    };

    return NextResponse.json({
      success: true,
      limits: userLimits,
      level: user.level,
      multipliers: {
        coins: levelMultiplier,
        gems: Math.pow(BALANCE_LIMITS.gems.levelMultiplier, user.level - 1),
        xp: Math.pow(BALANCE_LIMITS.xp.levelMultiplier, user.level - 1)
      }
    });

  } catch (error) {
    console.error('Get balance limits error:', error);
    return NextResponse.json({ error: 'Failed to get limits' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, currency, amount, reason } = await request.json();

    if (!userId || !currency || !amount || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await getDb();

    // Get user's current balance
    const user = await getOne(
      'SELECT id, level, coins, gems FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check limits
    const levelMultiplier = Math.pow(BALANCE_LIMITS.coins.levelMultiplier, user.level - 1);
    const maxBalance = currency === 'coins' 
      ? Math.floor(BALANCE_LIMITS.coins.maxBalance * levelMultiplier)
      : Math.floor(BALANCE_LIMITS.gems.maxBalance * levelMultiplier);

    const currentBalance = currency === 'coins' ? user.coins : user.gems;
    const newBalance = currentBalance + amount;

    if (newBalance > maxBalance) {
      return NextResponse.json({ 
        error: 'Balance limit exceeded',
        current: currentBalance,
        max: maxBalance,
        attempted: newBalance
      }, { status: 400 });
    }

    // Update balance
    const updateField = currency === 'coins' ? 'coins' : 'gems';
    const { run } = await import('@/lib/db');
    run(`UPDATE users SET ${updateField} = ? WHERE id = ?`, [newBalance, userId]);

    return NextResponse.json({
      success: true,
      message: `Successfully adjusted ${currency} balance`,
      adjustment: {
        currency,
        amount,
        reason,
        newBalance
      }
    });

  } catch (error) {
    console.error('Adjust balance error:', error);
    return NextResponse.json({ error: 'Failed to adjust balance' }, { status: 500 });
  }
}
