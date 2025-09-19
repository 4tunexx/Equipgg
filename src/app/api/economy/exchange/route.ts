import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from "../../../../lib/auth-utils";
import { supabase } from "../../../../lib/supabase";
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

    // Get user's current balance
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, coins, gems')
      .eq('id', session.user_id)
      .single();
    if (userError || !user) {
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
    const { error: updateError } = await supabase
      .from('users')
      .update({ coins: newCoins, gems: newGems })
      .eq('id', user.id);
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
    }

    // Record transaction (debit)
    const transactionId = uuidv4();
    await supabase.from('user_transactions').insert({
      id: transactionId,
      user_id: user.id,
      type: 'exchange',
      amount: -amount,
      currency: fromCurrency,
      description: `Exchanged ${amount} ${fromCurrency} for ${exchangeAmount} ${toCurrency}`,
      created_at: new Date().toISOString()
    });
    // Record transaction (credit)
    const receivedTransactionId = uuidv4();
    await supabase.from('user_transactions').insert({
      id: receivedTransactionId,
      user_id: user.id,
      type: 'exchange_received',
      amount: exchangeAmount,
      currency: toCurrency,
      description: `Received ${exchangeAmount} ${toCurrency} from exchange`,
      created_at: new Date().toISOString()
    });

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
