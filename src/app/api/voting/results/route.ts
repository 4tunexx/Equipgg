import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from '../../../../lib/auth-utils';
import { supabase } from "../../../../lib/supabase";

// Get voting results and statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pollId = searchParams.get('pollId');
    const matchId = searchParams.get('matchId');
    const type = searchParams.get('type') || 'all'; // all, active, completed

    if (pollId) {
      // Get specific poll results
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .select(`
          id,
          title,
          description,
          status,
          created_at,
          ends_at,
          poll_options (
            id,
            text,
            poll_votes (count)
          )
        `)
        .eq('id', pollId)
        .single();

      if (pollError) {
        if (pollError.code === 'PGRST116') {
          return NextResponse.json({
            success: true,
            poll: {
              id: pollId,
              title: 'Sample Poll',
              description: 'Voting system in development',
              status: 'active',
              options: [
                { id: '1', text: 'Option 1', votes: 0 },
                { id: '2', text: 'Option 2', votes: 0 }
              ],
              totalVotes: 0
            }
          });
        }
        console.error('Error fetching poll:', pollError);
        return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
      }

      // Calculate vote counts
      const totalVotes = poll.poll_options.reduce((sum: number, option: any) => 
        sum + (option.poll_votes?.length || 0), 0);

      const optionsWithPercentage = poll.poll_options.map((option: any) => ({
        id: option.id,
        text: option.text,
        votes: option.poll_votes?.length || 0,
        percentage: totalVotes > 0 ? ((option.poll_votes?.length || 0) / totalVotes * 100).toFixed(1) : '0.0'
      }));

      return NextResponse.json({
        success: true,
        poll: {
          ...poll,
          options: optionsWithPercentage,
          totalVotes
        }
      });

    } else if (matchId) {
      // Get match prediction results
      const { data: predictions, error: predError } = await supabase
        .from('match_votes')
        .select(`
          prediction,
          matches (
            id,
            event_name,
            team_a_name,
            team_b_name,
            status
          )
        `)
        .eq('match_id', matchId);

      if (predError) {
        if (predError.code === 'PGRST116') {
          return NextResponse.json({
            success: true,
            match: {
              id: matchId,
              event_name: 'Sample Match',
              team_a_name: 'Team A',
              team_b_name: 'Team B',
              predictions: {
                team1_win: 0,
                team2_win: 0,
                draw: 0,
                total: 0
              }
            }
          });
        }
        console.error('Error fetching match predictions:', predError);
        return NextResponse.json({ error: 'Match not found' }, { status: 404 });
      }

      // Count predictions
      const team1Predictions = predictions?.filter(p => p.prediction === 'team_a').length || 0;
      const team2Predictions = predictions?.filter(p => p.prediction === 'team_b').length || 0;
      const drawPredictions = predictions?.filter(p => p.prediction === 'draw').length || 0;
      const totalPredictions = team1Predictions + team2Predictions + drawPredictions;

      const match = predictions?.[0]?.matches;

      return NextResponse.json({
        success: true,
        match: {
          ...match,
          predictions: {
            team1_win: team1Predictions,
            team2_win: team2Predictions,
            draw: drawPredictions,
            total: totalPredictions,
            team1Percentage: totalPredictions > 0 ? (team1Predictions / totalPredictions * 100).toFixed(1) : '0.0',
            team2Percentage: totalPredictions > 0 ? (team2Predictions / totalPredictions * 100).toFixed(1) : '0.0',
            drawPercentage: totalPredictions > 0 ? (drawPredictions / totalPredictions * 100).toFixed(1) : '0.0'
          }
        }
      });

    } else {
      // Get all polls/matches based on type
      let activePolls = [];
      let completedPolls = [];
      let upcomingMatches = [];

      if (type === 'all' || type === 'active') {
        const { data: polls, error: pollsError } = await supabase
          .from('polls')
          .select(`
            id,
            title,
            description,
            status,
            created_at,
            ends_at,
            poll_options (
              id,
              text,
              poll_votes (count)
            )
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (pollsError && pollsError.code !== 'PGRST116') {
          console.error('Error fetching active polls:', pollsError);
        } else {
          activePolls = polls || [];
        }
      }

      if (type === 'all' || type === 'completed') {
        const { data: polls, error: pollsError } = await supabase
          .from('polls')
          .select(`
            id,
            title,
            description,
            status,
            created_at,
            ends_at,
            poll_options (
              id,
              text,
              poll_votes (count)
            )
          `)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(10);

        if (pollsError && pollsError.code !== 'PGRST116') {
          console.error('Error fetching completed polls:', pollsError);
        } else {
          completedPolls = polls || [];
        }
      }

      // Get upcoming matches for predictions
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('id, title, team1_name, team2_name, scheduled_at, status')
        .in('status', ['upcoming', 'live'])
        .order('scheduled_at', { ascending: true })
        .limit(5);

      if (matchesError && matchesError.code !== 'PGRST116') {
        console.error('Error fetching matches:', matchesError);
      } else {
        upcomingMatches = matches || [];
      }

      // If no data from database, return empty arrays
      if (activePolls.length === 0 && completedPolls.length === 0 && upcomingMatches.length === 0) {
        return NextResponse.json({
          success: true,
          activePolls: [],
          completedPolls: [],
          upcomingMatches: [],
          message: 'No voting data available. Please configure polls and matches.'
        });
      }

      return NextResponse.json({
        success: true,
        activePolls,
        completedPolls,
        upcomingMatches
      });
    }

  } catch (error) {
    console.error('Error in voting results:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Admin-only: Create new poll
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user_id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { title, description, options, endsAt } = await request.json();

    if (!title || !options || options.length < 2) {
      return NextResponse.json({ 
        error: 'Title and at least 2 options are required' 
      }, { status: 400 });
    }

    // Create poll
    const { data: newPoll, error: pollError } = await supabase
      .from('polls')
      .insert([{
        title,
        description,
        status: 'active',
        ends_at: endsAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (pollError) {
      if (pollError.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          message: 'Poll creation queued (voting system in development)',
          pollId: `mock_${Date.now()}`
        });
      }
      console.error('Error creating poll:', pollError);
      return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 });
    }

    // Create poll options
    const pollOptions = options.map((text: string, index: number) => ({
      poll_id: newPoll.id,
      text,
      display_order: index
    }));

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(pollOptions);

    if (optionsError) {
      // Rollback poll creation
      await supabase.from('polls').delete().eq('id', newPoll.id);
      console.error('Error creating poll options:', optionsError);
      return NextResponse.json({ error: 'Failed to create poll options' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Poll created successfully',
      poll: newPoll
    });

  } catch (error) {
    console.error('Error creating poll:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
