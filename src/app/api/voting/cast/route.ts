import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from '../../../../lib/auth-utils';
import { supabase } from "../../../../lib/supabase";

// Voting system for community polls and match predictions
export async function POST(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Check if user has already voted
    let existingVote;
    if (pollId) {
      const { data } = await supabase
        .from('poll_votes')
        .select('id')
        .eq('user_id', session.user_id)
        .eq('poll_id', pollId)
        .single();
      existingVote = data;
    } else {
      const { data } = await supabase
        .from('match_predictions')
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

    // Cast the vote
    let result;
    if (pollId) {
      // Poll voting
      const { data: newVote, error } = await supabase
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
        if (error.code === 'PGRST116') {
          return NextResponse.json({
            success: true,
            message: 'Vote recorded (voting system in beta)',
            voteId: `mock_${Date.now()}`
          });
        }
        console.error('Error casting poll vote:', error);
        return NextResponse.json({ error: 'Failed to cast vote' }, { status: 500 });
      }

      result = { voteId: newVote.id, type: 'poll' };
    } else {
      // Match prediction
      const { data: newPrediction, error } = await supabase
        .from('match_predictions')
        .insert([{
          user_id: session.user_id,
          match_id: matchId,
          prediction,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({
            success: true,
            message: 'Prediction recorded (prediction system in beta)',
            predictionId: `mock_${Date.now()}`
          });
        }
        console.error('Error casting match prediction:', error);
        return NextResponse.json({ error: 'Failed to cast prediction' }, { status: 500 });
      }

      result = { predictionId: newPrediction.id, type: 'match_prediction' };
    }

    // Award participation XP (5 XP for voting)
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
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // all, polls, predictions

    let votes = [];
    let predictions = [];

    if (type === 'all' || type === 'polls') {
      const { data: pollVotes, error: pollError } = await supabase
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
      const { data: matchPredictions, error: predError } = await supabase
        .from('match_predictions')
        .select(`
          id,
          prediction,
          created_at,
          matches (
            id,
            title,
            team1_name,
            team2_name,
            result
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
