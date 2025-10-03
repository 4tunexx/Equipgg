import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionWithToken } from '../../../../lib/auth-utils';
import { createRequestSupabaseClient, createServerSupabaseClient } from "../../../../lib/supabase";
import { secureDb } from '../../../../lib/secure-db';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated session and token
    const auth = await getAuthSessionWithToken(request);
    if (!auth || !auth.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = auth.session;
    // Use a request-scoped client bound to the user's token so RLS policies allow selecting user rows
    const reqClient = createRequestSupabaseClient(auth.token || undefined);

    // Fetch user bets from Supabase as the user
    const { data: bets, error } = await reqClient
      .from('user_bets')
      .select(`
        id,
        user_id,
        match_id,
        team_choice,
        amount,
        odds,
        potential_payout,
        status,
        placed_at,
        settled_at,
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
      // If table doesn't exist, return empty array
      if (error.code === 'PGRST116' || String(error.message).includes('does not exist') || String(error.message).includes('relation') || error.code === '42P01') {
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
          name: bet.team_choice === 'team_a' ? match?.team_a_name : match?.team_b_name,
          logo: bet.team_choice === 'team_a' ? match?.team_a_logo : match?.team_b_logo,
          dataAiHint: bet.team_choice === 'team_a' ? match?.team_a_name : match?.team_b_name
        },
        amount: bet.amount,
        odds: bet.odds,
        potentialWin: bet.potential_payout,
        potentialWinnings: bet.potential_payout,
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

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthSessionWithToken(request);
    if (!auth || !auth.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = auth.session;
    const { betId } = await request.json();

    if (!betId) {
      return NextResponse.json({ error: 'Bet ID required' }, { status: 400 });
    }

    // Use request-scoped client (user identity) to fetch their bet (RLS will enforce ownership)
    const reqClient = createRequestSupabaseClient(auth.token || undefined);
    const { data: bet, error: betError } = await reqClient
      .from('user_bets')
      .select('id, user_id, amount, status, match_id')
      .eq('id', betId)
      .single();

    if (betError || !bet) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 });
    }

    if (bet.status !== 'active') {
      return NextResponse.json({ error: 'Only active bets can be cancelled' }, { status: 400 });
    }

    // Use server admin client to perform refund and status update atomically-ish
    const server = createServerSupabaseClient();

    // Begin: update bet status
    const { error: updateBetError } = await server
      .from('user_bets')
      .update({ status: 'cancelled', settled_at: new Date().toISOString() })
      .eq('id', betId);

    if (updateBetError) {
      console.error('Error cancelling bet:', updateBetError);
      return NextResponse.json({ error: 'Failed to cancel bet' }, { status: 500 });
    }

    // Refund coins to user
    // Fetch current user balance via secureDb (server-side)
    const user = await secureDb.findOne('users', { id: session.user_id });
    if (!user) {
      // Rollback bet status
      await server.from('user_bets').update({ status: 'active', settled_at: null }).eq('id', betId);
      return NextResponse.json({ error: 'User not found' }, { status: 500 });
    }

    const newCoins = Number(user.coins || 0) + Number(bet.amount || 0);
    const { error: refundError } = await server
      .from('users')
      .update({ coins: newCoins })
      .eq('id', session.user_id);

    if (refundError) {
      console.error('Error refunding coins:', refundError);
      // Rollback bet status
      await server.from('user_bets').update({ status: 'active', settled_at: null }).eq('id', betId);
      return NextResponse.json({ error: 'Failed to refund coins' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Bet cancelled and coins refunded',
      refundedAmount: bet.amount
    });

  } catch (error) {
    console.error('Error cancelling bet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated session and token
    const auth = await getAuthSessionWithToken(request);
    if (!auth || !auth.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const session = auth.session;

    const { match_id, team_bet, amount, odds } = await request.json();

    if (!match_id || !team_bet || !amount || !odds) {
      return NextResponse.json({ 
        error: 'Missing required fields: match_id, team_bet, amount, odds' 
      }, { status: 400 });
    }

    // Validate that user has sufficient balance (server-side)
    const server = createServerSupabaseClient();
    const { data: userData, error: userError } = await server
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
    const { data: bet, error: betError } = await server
      .from('user_bets')
      .insert([{
        user_id: session.user_id,
        match_id,
        team_choice: team_bet,
        amount,
        odds,
        potential_payout: potential_winnings,
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

    // Deduct amount from user balance (server-side)
    const serverUpdate = await server
      .from('users')
      .update({ coins: Number(userData.coins) - Number(amount) })
      .eq('id', session.user_id);

    const updateError = serverUpdate.error;

    if (updateError) {
      console.error('Error updating user balance:', updateError);
      // Rollback the bet if balance update fails
      await server.from('user_bets').delete().eq('id', bet.id);
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

// PATCH: edit an active bet (change team_choice) before match starts
export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthSessionWithToken(request);
    if (!auth || !auth.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = auth.session;
    const { betId, new_team_choice } = await request.json();

    if (!betId || !new_team_choice) {
      return NextResponse.json({ error: 'betId and new_team_choice required' }, { status: 400 });
    }

    const reqClient = createRequestSupabaseClient(auth.token || undefined);
    // Ensure bet belongs to user and is active
    const { data: bet, error: betError } = await reqClient
      .from('user_bets')
      .select('id, user_id, match_id, status')
      .eq('id', betId)
      .single();

    if (betError || !bet) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 });
    }

    if (bet.status !== 'active' && bet.status !== 'pending') {
      return NextResponse.json({ error: 'Only active/pending bets can be edited' }, { status: 400 });
    }

    // Check match status to ensure betting still allowed
    const server = createServerSupabaseClient();
    const { data: match, error: matchError } = await server
      .from('matches')
      .select('id, status')
      .eq('id', bet.match_id)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.status !== 'upcoming') {
      return NextResponse.json({ error: 'Cannot edit bet after match has started' }, { status: 400 });
    }

    // Perform update via server (admin) client
    const { error: updateError } = await server
      .from('user_bets')
      .update({ team_choice: new_team_choice, updated_at: new Date().toISOString() })
      .eq('id', betId);

    if (updateError) {
      console.error('Error updating bet:', updateError);
      return NextResponse.json({ error: 'Failed to update bet' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Bet updated' });
  } catch (error) {
    console.error('Error editing bet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
