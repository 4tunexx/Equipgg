import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-utils';
import { getDb, getOne, run } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fromCurrency, toCurrency, amount } = await request.json();

    if (!fromCurrency || !toCurrency || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid exchange parameters' }, { status: 400 });
    }

    await getDb();

    // Get user's current balance
    const user = await getOne(
      'SELECT id, coins, gems FROM users WHERE id = ?',
      [session.user_id]
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let newCoins = user.coins;
    let newGems = user.gems;
    let exchangeRate = 0;
    let exchangeAmount = 0;

    // Exchange rates
    const COINS_TO_GEMS_RATE = 1000; // 1000 coins = 1 gem
    const GEMS_TO_COINS_RATE = 800;  // 1 gem = 800 coins (slight loss to prevent inflation)

    if (fromCurrency === 'coins' && toCurrency === 'gems') {
      exchangeRate = COINS_TO_GEMS_RATE;
      exchangeAmount = Math.floor(amount / exchangeRate);
      
      if (amount < exchangeRate) {
        return NextResponse.json({ 
          error: `Minimum exchange is ${exchangeRate} coins for 1 gem` 
        }, { status: 400 });
      }
      
      if (user.coins < amount) {
        return NextResponse.json({ 
          error: 'Insufficient coins',
          balance: user.coins 
        }, { status: 400 });
      }
      
      newCoins = user.coins - amount;
      newGems = user.gems + exchangeAmount;
      
    } else if (fromCurrency === 'gems' && toCurrency === 'coins') {
      exchangeRate = GEMS_TO_COINS_RATE;
      exchangeAmount = amount * exchangeRate;
      
      if (user.gems < amount) {
        return NextResponse.json({ 
          error: 'Insufficient gems',
          balance: user.gems 
        }, { status: 400 });
      }
      
      newCoins = user.coins + exchangeAmount;
      newGems = user.gems - amount;
      
    } else {
      return NextResponse.json({ 
        error: 'Invalid currency pair. Only coins↔gems exchange supported' 
      }, { status: 400 });
    }

    // Update user balance
    run('UPDATE users SET coins = ?, gems = ? WHERE id = ?', [newCoins, newGems, user.id]);

    // Record transaction
    const transactionId = uuidv4();
    run(`
      INSERT INTO user_transactions (id, user_id, type, amount, currency, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      transactionId,
      user.id,
      'exchange',
      -amount,
      fromCurrency,
      `Exchanged ${amount} ${fromCurrency} for ${exchangeAmount} ${toCurrency}`,
      new Date().toISOString()
    ]);

    // Record the received currency transaction
    const receivedTransactionId = uuidv4();
    run(`
      INSERT INTO user_transactions (id, user_id, type, amount, currency, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      receivedTransactionId,
      user.id,
      'exchange_received',
      exchangeAmount,
      toCurrency,
      `Received ${exchangeAmount} ${toCurrency} from exchange`,
      new Date().toISOString()
    ]);

    return NextResponse.json({
      success: true,
      message: `Successfully exchanged ${amount} ${fromCurrency} for ${exchangeAmount} ${toCurrency}`,
      exchange: {
        from: { currency: fromCurrency, amount },
        to: { currency: toCurrency, amount: exchangeAmount },
        rate: exchangeRate
      },
      newBalance: {
        coins: newCoins,
        gems: newGems
      }
    });

  } catch (error) {
    console.error('Exchange error:', error);
    return NextResponse.json({ error: 'Exchange failed' }, { status: 500 });
  }
}
