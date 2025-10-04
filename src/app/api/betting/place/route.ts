import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from '../../../../lib/supabase';
import { getAuthSessionWithToken } from "../../../../lib/auth-utils";
import { addXP } from "../../../../lib/xp-service";
import { achievementService } from "../../../../lib/achievement-service";

// Note: create server admin client inside the handler to avoid import-time errors

export async function POST(request: NextRequest) {
  try {
    let supabaseAdmin;
    try {
      supabaseAdmin = createServerSupabaseClient();
    } catch (e) {
      console.error('supabase admin client creation failed:', e);
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const auth = await getAuthSessionWithToken(request);
    if (!auth || !auth.session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const session = auth.session;

    const { matchId, amount, team, betType = 'match_winner' } = await request.json();

    // Debug: log incoming request payload (avoid logging secrets)
    console.log('/api/betting/place payload:', {
      matchId,
      amount,
      team,
      betType
    });

    // validate matchId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (matchId && typeof matchId === 'string' && !uuidRegex.test(matchId)) {
      console.warn('Invalid matchId format provided to /api/betting/place:', matchId);
      return NextResponse.json({ error: 'Invalid matchId format; expected UUID' }, { status: 400 });
    }
    
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
      console.error('betting/place user select error:', JSON.stringify(userError));
      return NextResponse.json({ error: userError?.message || "User not found" }, { status: 404 });
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
      console.error('betting/place match select error:', JSON.stringify(matchError));
      return NextResponse.json({ error: matchError?.message || "Match not found" }, { status: 404 });
    }

    if (matchData.status !== 'upcoming') {
      return NextResponse.json({ error: "Betting is closed for this match" }, { status: 400 });
    }

    // Normalize team value: frontend may send the team name (match.team1.name) or 'team_a'/'team_b'
    const normalize = (input: any) => {
      if (!input || typeof input !== 'string') return null;
      const v = input.trim();
      if (v === 'team_a' || v === 'teamA' || v === 'team_a') return 'team_a';
      if (v === 'team_b' || v === 'teamB' || v === 'team_b') return 'team_b';
      // Compare against match team names (case-insensitive)
      if (v.toLowerCase() === String(matchData.team_a_name).toLowerCase()) return 'team_a';
      if (v.toLowerCase() === String(matchData.team_b_name).toLowerCase()) return 'team_b';
      return null;
    };

  const normalizedTeam = normalize(team);
  console.log('Normalized team:', normalizedTeam);
    if (!normalizedTeam) {
      console.warn('Invalid team value provided to /api/betting/place:', team);
      return NextResponse.json({ error: 'Invalid team value' }, { status: 400 });
    }

    // Calculate odds and potential payout
    const odds = normalizedTeam === 'team_a' ? matchData.team_a_odds : matchData.team_b_odds;
    const potentialPayout = Math.floor(amount * odds);

    // Create bet record with correct column names (team_choice must be 'team_a' or 'team_b')
    const betData = {
      user_id: session.user_id,
      match_id: matchId,
      team_choice: normalizedTeam,
      amount: amount,
      odds: odds,
      potential_payout: potentialPayout,
      status: 'active'
    };

    // Debug: log betData before insert
    console.log('betData to insert:', betData);

    // Start transaction: deduct coins and create bet
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        coins: userData.coins - amount
      })
      .eq('id', session.user_id);

    if (updateError) {
      console.error('betting/place update balance error:', JSON.stringify(updateError));
      return NextResponse.json({ error: updateError.message || "Failed to update balance" }, { status: 500 });
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

      console.error('Bet insertion error:', JSON.stringify(betError));
      return NextResponse.json({ error: betError.message || "Failed to place bet" }, { status: 500 });
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

    // Check for achievements
    try {
      const achievements = await achievementService.checkAchievements(session.user_id, 'bet_placed', {
        amount: amount,
        payout: potentialPayout,
        match: matchData
      });
      
      if (achievements.length > 0) {
        console.log(`🎉 User ${session.user_id} unlocked ${achievements.length} achievements for placing bet!`);
      }
    } catch (achievementError) {
      console.warn('Failed to check achievements for bet placement:', achievementError);
      // Don't fail the bet if achievement check fails
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
