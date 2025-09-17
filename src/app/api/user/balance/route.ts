import { NextRequest, NextResponse } from 'next/server';
import { getDb, getOne } from '@/lib/db';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    await getDb();
    
    // Get user's balance from database
    const balance = await getOne(
      'SELECT coins, gems, xp, level FROM users WHERE id = ?',
      [session.user_id]
    );

    if (!balance) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      balance
    });

  } catch (error) {
    console.error('Balance fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const { amount, type, reason } = await request.json();

    if (!amount || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // In a real app, you would:
    // 1. Validate the transaction
    // 2. Update user's balance in database
    // 3. Record transaction history

    // For now, simulate balance update
    const currentBalance = 15000; // This would come from database
    const newBalance = type === 'add' ? currentBalance + amount : currentBalance - amount;
    
    if (newBalance < 0) {
      return NextResponse.json({ 
        error: 'Insufficient balance',
        currentBalance 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Balance ${type === 'add' ? 'increased' : 'decreased'} by ${amount}`,
      newBalance,
      transaction: {
        amount,
        type,
        reason: reason || 'Manual adjustment',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Balance update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}