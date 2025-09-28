import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase/client";
import { createClient } from '@supabase/supabase-js';
import { getAuthSession } from "../../../../lib/auth-utils";
import { addXP } from "../../../../lib/xp-service";

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

    // Get match details from database
    const { data: matchData, error: matchError } = await supabaseAdmin
      .from('matches')
      .select('id, team_a_name, team_b_name, team_a_odds, team_b_odds, status, match_date, start_time')
      .eq('id', matchId)
      .single();

    if (matchError || !matchData) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (matchData.status !== 'upcoming') {
      return NextResponse.json({ error: "Betting is closed for this match" }, { status: 400 });
    }

    // Calculate odds and potential payout
    const odds = team === 'team_a' ? matchData.team_a_odds : matchData.team_b_odds;
    const potentialPayout = Math.floor(amount * odds);

    // Create bet record with correct column names
    const betData = {
      user_id: session.user_id,
      match_id: matchId,
      team_choice: team,
      amount: amount,
      odds: odds,
      potential_payout: potentialPayout,
      status: 'active'
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

    // Insert bet record into user_bets table
    const { data: betRecord, error: betError } = await supabaseAdmin
      .from('user_bets')
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

      console.error('Bet insertion error:', betError);
      return NextResponse.json({ error: "Failed to place bet" }, { status: 500 });
    }

    // Award XP for placing a bet
    try {
      await addXP(
        session.user_id,
        10, // 10 XP for placing a bet
        'betting',
        `Placed bet on ${matchData.team_a_name} vs ${matchData.team_b_name}`
      );
    } catch (xpError) {
      console.warn('Failed to award XP for bet placement:', xpError);
      // Don't fail the bet if XP award fails
    }

    return NextResponse.json({
      success: true,
      bet: betRecord,
      newBalance: userData.coins - amount,
      match: {
        id: matchData.id,
        team_a_name: matchData.team_a_name,
        team_b_name: matchData.team_b_name,
        team_a_odds: matchData.team_a_odds,
        team_b_odds: matchData.team_b_odds,
        status: matchData.status,
        match_date: matchData.match_date,
        start_time: matchData.start_time
      }
    });

  } catch (error) {
    console.error('Error placing bet:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
