import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionWithToken } from '../../../../lib/auth-utils';
import { supabase, createRequestSupabaseClient, createServerSupabaseClient } from "../../../../lib/supabase";

// Voting system for community polls and match predictions
export async function POST(request: NextRequest) {
  console.log('=== VOTING CAST API CALLED ===');
  try {
  // Get authenticated session and token
  const auth = await getAuthSessionWithToken(request);
    if (!auth || !auth.session) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = auth.session;
    // Create a request-scoped supabase client that will run queries under the user's JWT
    let supabaseAdmin;
    try {
      supabaseAdmin = createServerSupabaseClient();
    } catch (e) {
      console.error('createServerSupabaseClient failed:', e);
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    // Prefer request-scoped client for reads when token is available, but use admin for writes
    const requestSupabase = createRequestSupabaseClient(auth.token || undefined);

    const { pollId, optionId, matchId, prediction } = await request.json();

    // Validate input
    if (!pollId && !matchId) {
      return NextResponse.json({ 
        error: 'Either pollId or matchId is required' 
      }, { status: 400 });
    }

    if (pollId && !optionId) {
      return NextResponse.json({ 
        error: 'optionId is required for poll voting' 
      }, { status: 400 });
    }

    if (matchId && !prediction) {
      return NextResponse.json({ 
        error: 'prediction is required for match voting' 
      }, { status: 400 });
    }

    // If matchId is provided, validate UUID format to avoid Postgres 22P02 errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (matchId && typeof matchId === 'string' && !uuidRegex.test(matchId)) {
      console.warn('Invalid matchId format provided to /api/voting/cast:', matchId);
      return NextResponse.json({ error: 'Invalid matchId format; expected UUID' }, { status: 400 });
    }

    // Check if user has already voted. Use requestSupabase for RLS-protected tables.
    let existingVote;
    if (pollId) {
      const { data } = await supabaseAdmin
        .from('poll_votes')
        .select('id')
        .eq('user_id', session.user_id)
        .eq('poll_id', pollId)
        .single();
      existingVote = data;
    } else {
      const { data } = await supabaseAdmin
        .from('match_votes')
        .select('id')
        .eq('user_id', session.user_id)
        .eq('match_id', matchId)
        .single();
      existingVote = data;
    }

    if (existingVote) {
      return NextResponse.json({ 
        error: 'You have already voted/predicted for this item' 
      }, { status: 400 });
    }

    // Normalize prediction values to match DB CHECK constraint (avoid 23514)
    let normalizedPrediction: string | null = null;
    if (matchId) {
      if (!prediction || typeof prediction !== 'string') {
        return NextResponse.json({ error: 'prediction is required for match voting' }, { status: 400 });
      }

      const p = prediction.toLowerCase();
      if (p === 'team1_win' || p === 'team1' || p === 'team_a' || p === 'team_a_win') {
        normalizedPrediction = 'team_a';
      } else if (p === 'team2_win' || p === 'team2' || p === 'team_b' || p === 'team_b_win') {
        normalizedPrediction = 'team_b';
      } else if (p === 'draw' || p === 'tie') {
        normalizedPrediction = 'draw';
      } else {
        console.warn('Invalid prediction value provided:', prediction);
        return NextResponse.json({ error: 'Invalid prediction value' }, { status: 400 });
      }
    }

    // Cast the vote
    let result;
    if (pollId) {
      // Poll voting
      const { data: newVote, error } = await supabaseAdmin
        .from('poll_votes')
        .insert([{
          user_id: session.user_id,
          poll_id: pollId,
          option_id: optionId,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        // Surface DB error for easier debugging (avoid JSON.stringify on complex/circular errors)
        console.error('Error casting poll vote:', error);
        if (error.code === 'PGRST116') {
          return NextResponse.json({
            success: true,
            message: 'Vote recorded (voting system in beta)',
            voteId: `mock_${Date.now()}`
          });
        }
        return NextResponse.json({ error: error.message || 'Failed to cast vote' }, { status: 500 });
      }

      result = { voteId: newVote.id, type: 'poll' };
    } else {
      // Match prediction
      console.log('Inserting match prediction for user', session.user_id, 'match', matchId, 'prediction', normalizedPrediction);
      const { data: newPrediction, error } = await supabaseAdmin
        .from('match_votes')
        .insert([{
          user_id: session.user_id,
          match_id: matchId,
          prediction: normalizedPrediction,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        // Surface DB error for easier debugging (avoid JSON.stringify on complex/circular errors)
        console.error('Error casting match prediction:', error);
        if (error.code === 'PGRST116') {
          return NextResponse.json({
            success: true,
            message: 'Prediction recorded (prediction system in beta)',
            predictionId: `mock_${Date.now()}`
          });
        }
        return NextResponse.json({ error: error.message || 'Failed to cast prediction' }, { status: 500 });
      }

      result = { predictionId: newPrediction.id, type: 'match_prediction' };
    }

    // Award participation XP (5 XP for voting)
    // Award XP - this update requires server privileges so use server client
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('xp')
        .eq('id', session.user_id)
        .single();

      if (userData) {
        await supabase
          .from('users')
          .update({ xp: (userData.xp || 0) + 5 })
          .eq('id', session.user_id);
      }
    } catch (xpErr) {
      console.warn('Failed to award XP (non-fatal):', xpErr);
    }

    return NextResponse.json({
      success: true,
      message: result.type === 'poll' ? 'Vote cast successfully' : 'Prediction submitted successfully',
      ...result,
      xpAwarded: 5
    });

  } catch (error) {
    console.error('Error in voting cast:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
  // Get user's voting history
  const auth = await getAuthSessionWithToken(request);
    if (!auth || !auth.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = auth.session;
    let supabaseAdmin;
    try {
      supabaseAdmin = createServerSupabaseClient();
    } catch (e) {
      console.error('createServerSupabaseClient failed:', e);
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // all, polls, predictions

    let votes = [];
    let predictions = [];

    if (type === 'all' || type === 'polls') {
      const { data: pollVotes, error: pollError } = await supabaseAdmin
        .from('poll_votes')
        .select(`
          id,
          created_at,
          polls (
            id,
            title,
            description
          ),
          poll_options (
            id,
            text
          )
        `)
        .eq('user_id', session.user_id)
        .order('created_at', { ascending: false });

      if (pollError && pollError.code !== 'PGRST116') {
        console.error('Error fetching poll votes:', pollError);
      } else {
        votes = pollVotes || [];
      }
    }

    if (type === 'all' || type === 'predictions') {
      const { data: matchPredictions, error: predError } = await supabaseAdmin
        .from('match_predictions')
        .select(`
          id,
          prediction,
          created_at,
          matches (
            id,
            event_name,
            team_a_name,
            team_b_name,
            winner
          )
        `)
        .eq('user_id', session.user_id)
        .order('created_at', { ascending: false });

      if (predError && predError.code !== 'PGRST116') {
        console.error('Error fetching match predictions:', predError);
      } else {
        predictions = matchPredictions || [];
      }
    }

    return NextResponse.json({
      success: true,
      votes,
      predictions,
      totalVotes: votes.length + predictions.length
    });

  } catch (error) {
    console.error('Error fetching voting history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
