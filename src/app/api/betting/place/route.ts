import { NextRequest, NextResponse } from "next/server";
import { supabase } from '@/lib/supabase';
import { createSupabaseQueries } from '@/lib/supabase/queries';

const queries = createSupabaseQueries(supabase);

export async function POST(request: NextRequest) {
  try {
    // Get user session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { amount, gameType, betData } = await request.json();

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid bet amount' },
        { status: 400 }
      );
    }

    if (!gameType) {
      return NextResponse.json(
        { error: 'Game type is required' },
        { status: 400 }
      );
    }

    // Check if user has sufficient balance
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('coins')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.coins < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Place the bet
    const bet = await queries.placeBet(userId, amount, gameType, betData);
    
    // Deduct coins from user balance
    await queries.updateUserCoins(userId, user.coins - amount);

    return NextResponse.json({ 
      success: true,
      bet,
      message: 'Bet placed successfully'
    });

  } catch (error) {
    console.error('Error placing bet:', error);
    return NextResponse.json(
      { error: 'Failed to place bet' },
      { status: 500 }
    );
  }
}
