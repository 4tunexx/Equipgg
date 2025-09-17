import { NextRequest, NextResponse } from 'next/server';
import { getDb, run, getOne } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { matchId, teamId } = await request.json();
    
    if (!matchId || !teamId) {
      return NextResponse.json(
        { error: 'Match ID and Team ID are required' },
        { status: 400 }
      );
    }

    // Get user from session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('equipgg_session');
    const sessionToken = sessionCookie?.value;
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await getDb(); // Ensure database is initialized
    
    // Verify session and get user
    const session = await getOne<{ user_id: string }>('SELECT user_id FROM sessions WHERE token = ?', [sessionToken]);
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const userId = session.user_id;

    // Check if user already voted for this match
    const existingVote = await getOne<{ id: string }>(
      'SELECT id FROM match_votes WHERE user_id = ? AND match_id = ?', 
      [userId, matchId]
    );

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted for this match' },
        { status: 400 }
      );
    }

    // Generate vote ID
    const voteId = `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert the vote
    await run(
      'INSERT INTO match_votes (id, user_id, match_id, team_id) VALUES (?, ?, ?, ?)',
      [voteId, userId, matchId, teamId]
    );

    // Update vote statistics
    const currentStats = await getOne<any>(
      'SELECT * FROM match_vote_stats WHERE match_id = ?', 
      [matchId]
    );

    if (currentStats) {
      // Update existing stats
      const team1Votes = teamId === 'team1' ? currentStats.team1_votes + 1 : currentStats.team1_votes;
      const team2Votes = teamId === 'team2' ? currentStats.team2_votes + 1 : currentStats.team2_votes;
      const totalVotes = team1Votes + team2Votes;

      await run(
        'UPDATE match_vote_stats SET team1_votes = ?, team2_votes = ?, total_votes = ?, last_updated = CURRENT_TIMESTAMP WHERE match_id = ?',
        [team1Votes, team2Votes, totalVotes, matchId]
      );
    } else {
      // Create new stats entry
      const team1Votes = teamId === 'team1' ? 1 : 0;
      const team2Votes = teamId === 'team2' ? 1 : 0;
      const totalVotes = 1;

      await run(
        'INSERT INTO match_vote_stats (match_id, team1_votes, team2_votes, total_votes) VALUES (?, ?, ?, ?)',
        [matchId, team1Votes, team2Votes, totalVotes]
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Vote cast successfully',
      voteId 
    });

  } catch (error) {
    console.error('Error casting vote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}