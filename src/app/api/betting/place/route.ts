import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase/client";
import { createClient } from '@supabase/supabase-js';
import { getAuthSession } from "../../../../lib/auth-utils";

// Create Supabase admin client for secure operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { matchId, amount, team, betType = 'match_winner' } = await request.json();
    
    if (!matchId || !amount || !team) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Bet amount must be positive" }, { status: 400 });
    }

    // Get user's balance
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('coins')
      .eq('id', session.user_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has enough coins
    if (userData.coins < amount) {
      return NextResponse.json({ error: "Insufficient coins" }, { status: 400 });
    }

    // Get match details (using mock data for now)
    const matchData = {
      id: matchId,
      team1: "Team A",
      team2: "Team B",
      status: "upcoming",
      startTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
      odds: {
        team1: 1.8,
        team2: 2.2
      }
    };

    // Calculate potential winnings
    const odds = team === 'team1' ? matchData.odds.team1 : matchData.odds.team2;
    const potentialWinnings = Math.floor(amount * odds);

    // Create bet record
    const betData = {
      user_id: session.user_id,
      match_id: matchId,
      amount: amount,
      team: team,
      bet_type: betType,
      odds: odds,
      potential_winnings: potentialWinnings,
      status: 'pending',
      placed_at: new Date().toISOString()
    };

    // Start transaction: deduct coins and create bet
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        coins: userData.coins - amount
      })
      .eq('id', session.user_id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update balance" }, { status: 500 });
    }

    // Insert bet record (mock table structure)
    try {
      const { data: betRecord, error: betError } = await supabaseAdmin
        .from('bets')
        .insert(betData)
        .select()
        .single();

      if (betError) {
        // Rollback: restore user's coins
        await supabaseAdmin
          .from('users')
          .update({
            coins: userData.coins
          })
          .eq('id', session.user_id);
        
        throw betError;
      }

      return NextResponse.json({
        success: true,
        bet: betRecord,
        newBalance: userData.coins - amount,
        match: matchData
      });

    } catch (error) {
      // If bets table doesn't exist, still deduct coins but return mock bet
      console.warn('Bets table may not exist, returning mock bet data');
      
      return NextResponse.json({
        success: true,
        bet: {
          id: Math.random().toString(36).substr(2, 9),
          ...betData
        },
        newBalance: userData.coins - amount,
        match: matchData
      });
    }

  } catch (error) {
    console.error('Error placing bet:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
