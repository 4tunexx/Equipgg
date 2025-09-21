import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '../../../../lib/auth-utils';
import { supabase } from "../../../../lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('coins, gems, xp, level')
      .eq('id', session.user_id)
      .single();
    if (userDataError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      balance: userData
    });
  } catch (error) {
    console.error('Balance fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, type, reason } = await request.json();
    if (!amount || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch current balance
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('coins')
      .eq('id', session.user_id)
      .single();
    if (userDataError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const currentBalance = userData.coins || 0;
    const newBalance = type === 'add' ? currentBalance + amount : currentBalance - amount;
    if (newBalance < 0) {
      return NextResponse.json({ 
        error: 'Insufficient balance',
        currentBalance 
      }, { status: 400 });
    }
    // Update balance in DB
    const { error: updateError } = await supabase
      .from('users')
      .update({ coins: newBalance })
      .eq('id', session.user_id);
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
    }
    // Optionally, record transaction history
    await supabase.from('user_transactions').insert([
      {
        user_id: session.user_id,
        type,
        amount,
        description: reason || 'Manual adjustment',
        created_at: new Date().toISOString()
      }
    ]);
    return NextResponse.json({
      success: true,
      message: `Balance ${type === 'add' ? 'increased' : 'decreased'} by ${amount}`,
      newBalance
    });
  } catch (error) {
    console.error('Balance update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}