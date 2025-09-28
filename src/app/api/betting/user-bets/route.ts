import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from '../../../../lib/auth-utils';
import { supabase } from "../../../../lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user bets from Supabase
    const { data: bets, error } = await supabase
      .from('user_bets')
      .select(`
        id,
        user_id,
        match_id,
        team_bet,
        amount,
        odds,
        potential_winnings,
        status,
        created_at,
        updated_at,
        matches (
          id,
          team_a_name,
          team_a_logo,
          team_b_name,
          team_b_logo,
          status,
          match_date,
          start_time,
          event_name
        )
      `)
      .eq('user_id', session.user_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user bets:', error);
      console.error('Error details:', error.code, error.message);
      // If table doesn't exist, return empty array
      if (error.code === 'PGRST116' || error.message.includes('does not exist') || error.message.includes('relation') || error.code === '42P01') {
        console.log('user_bets table does not exist, returning empty array');
        return NextResponse.json({ 
          bets: [],
          message: 'Betting feature not yet available - database tables pending'
        });
      }
      return NextResponse.json({ error: 'Failed to fetch bets' }, { status: 500 });
    }

    // Transform the data to match the frontend expected format
    const transformedBets = (bets || []).map(bet => {
      const match = Array.isArray(bet.matches) ? bet.matches[0] : bet.matches;
      
      return {
        id: bet.id,
        matchTitle: match?.event_name || 'Match',
        team: {
          name: bet.team_bet === 'team1' ? match?.team_a_name : match?.team_b_name,
          logo: bet.team_bet === 'team1' ? match?.team_a_logo : match?.team_b_logo,
          dataAiHint: bet.team_bet === 'team1' ? match?.team_a_name : match?.team_b_name
        },
        amount: bet.amount,
        odds: bet.odds,
        potentialWin: bet.potential_winnings,
        potentialWinnings: bet.potential_winnings,
        status: bet.status,
        timestamp: bet.created_at,
        match: {
          team1: {
            name: match?.team_a_name || 'Team 1',
            logo: match?.team_a_logo || '/default-team-logo.png',
            dataAiHint: match?.team_a_name || 'Team 1'
          },
          team2: {
            name: match?.team_b_name || 'Team 2', 
            logo: match?.team_b_logo || '/default-team-logo.png',
            dataAiHint: match?.team_b_name || 'Team 2'
          }
        }
      };
    });

    return NextResponse.json({ 
      bets: transformedBets,
      success: true 
    });

  } catch (error) {
    console.error('Error in user-bets API:', error);
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

    const { match_id, team_bet, amount, odds } = await request.json();

    if (!match_id || !team_bet || !amount || !odds) {
      return NextResponse.json({ 
        error: 'Missing required fields: match_id, team_bet, amount, odds' 
      }, { status: 400 });
    }

    // Validate that user has sufficient balance
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('coins')
      .eq('id', session.user_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (userData.coins < amount) {
      return NextResponse.json({ 
        error: 'Insufficient balance',
        currentBalance: userData.coins 
      }, { status: 400 });
    }

    const potential_winnings = amount * odds;

    // Create the bet
    const { data: bet, error: betError } = await supabase
      .from('user_bets')
      .insert([{
        user_id: session.user_id,
        match_id,
        team_bet,
        amount,
        odds,
        potential_winnings,
        status: 'pending'
      }])
      .select()
      .single();

    if (betError) {
      console.error('Error creating bet:', betError);
      // If table doesn't exist, return helpful message
      if (betError.code === 'PGRST116' || betError.message.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Betting feature not yet available'
        }, { status: 503 });
      }
      return NextResponse.json({ error: 'Failed to create bet' }, { status: 500 });
    }

    // Deduct amount from user balance
    const { error: updateError } = await supabase
      .from('users')
      .update({ coins: userData.coins - amount })
      .eq('id', session.user_id);

    if (updateError) {
      console.error('Error updating user balance:', updateError);
      // Rollback the bet if balance update fails
      await supabase.from('user_bets').delete().eq('id', bet.id);
      return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
    }

    return NextResponse.json({ 
      bet,
      success: true,
      message: 'Bet placed successfully'
    });

  } catch (error) {
    console.error('Error in create bet API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
