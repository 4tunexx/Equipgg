import { NextRequest, NextResponse } from 'next/server';
import { getDb, getOne, getAll } from '@/lib/db';
import { parse } from 'cookie';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');
    
    if (!matchId) {
      return NextResponse.json(
        { error: 'Match ID is required' },
        { status: 400 }
      );
    }

    await getDb(); // Ensure database is initialized
    
    // Get vote statistics for the match
    const stats = await getOne<{
      match_id: string;
      team1_votes: number;
      team2_votes: number;
      total_votes: number;
      last_updated: string;
    }>(
      'SELECT * FROM match_vote_stats WHERE match_id = ?', 
      [matchId]
    );

    if (!stats) {
      // No votes yet, return zero stats
      return NextResponse.json({
        matchId,
        team1Votes: 0,
        team2Votes: 0,
        totalVotes: 0,
        team1Percentage: 0,
        team2Percentage: 0,
        hasVoted: false
      });
    }

    // Calculate percentages
    const team1Percentage = stats.total_votes > 0 ? Math.round((stats.team1_votes / stats.total_votes) * 100) : 0;
    const team2Percentage = stats.total_votes > 0 ? Math.round((stats.team2_votes / stats.total_votes) * 100) : 0;

    // Check if current user has voted (if authenticated)
    let hasVoted = false;
    let userVote = null;
    
    const cookies = parse(request.headers.get('cookie') || '');
    const sessionToken = cookies.session;
    
    if (sessionToken) {
      const session = await getOne<{ user_id: string }>('SELECT user_id FROM sessions WHERE token = ?', [sessionToken]);
      if (session) {
        const vote = await getOne<{ team_id: string }>(
          'SELECT team_id FROM match_votes WHERE user_id = ? AND match_id = ?', 
          [session.user_id, matchId]
        );
        if (vote) {
          hasVoted = true;
          userVote = vote.team_id;
        }
      }
    }

    return NextResponse.json({
      matchId,
      team1Votes: stats.team1_votes,
      team2Votes: stats.team2_votes,
      totalVotes: stats.total_votes,
      team1Percentage,
      team2Percentage,
      hasVoted,
      userVote
    });

  } catch (error) {
    console.error('Error getting vote results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get voting results for multiple matches
export async function POST(request: NextRequest) {
  try {
    const { matchIds } = await request.json();
    
    if (!matchIds || !Array.isArray(matchIds)) {
      return NextResponse.json(
        { error: 'Match IDs array is required' },
        { status: 400 }
      );
    }

    await getDb(); // Ensure database is initialized
    
    // Get user info if authenticated
    let userId = null;
    const cookies = parse(request.headers.get('cookie') || '');
    const sessionToken = cookies.session;
    
    if (sessionToken) {
      const session = await getOne<{ user_id: string }>('SELECT user_id FROM sessions WHERE token = ?', [sessionToken]);
      if (session) {
        userId = session.user_id;
      }
    }

    const results = [];

    for (const matchId of matchIds) {
      // Get vote statistics
      const stats = await getOne<{
        match_id: string;
        team1_votes: number;
        team2_votes: number;
        total_votes: number;
        last_updated: string;
      }>(
        'SELECT * FROM match_vote_stats WHERE match_id = ?', 
        [matchId]
      );

      let hasVoted = false;
      let userVote = null;

      // Check if user voted for this match
      if (userId) {
        const vote = await getOne<{ team_id: string }>(
          'SELECT team_id FROM match_votes WHERE user_id = ? AND match_id = ?', 
          [userId, matchId]
        );
        if (vote) {
          hasVoted = true;
          userVote = vote.team_id;
        }
      }

      if (stats) {
        const team1Percentage = stats.total_votes > 0 ? Math.round((stats.team1_votes / stats.total_votes) * 100) : 0;
        const team2Percentage = stats.total_votes > 0 ? Math.round((stats.team2_votes / stats.total_votes) * 100) : 0;

        results.push({
          matchId,
          team1Votes: stats.team1_votes,
          team2Votes: stats.team2_votes,
          totalVotes: stats.total_votes,
          team1Percentage,
          team2Percentage,
          hasVoted,
          userVote
        });
      } else {
        results.push({
          matchId,
          team1Votes: 0,
          team2Votes: 0,
          totalVotes: 0,
          team1Percentage: 0,
          team2Percentage: 0,
          hasVoted,
          userVote
        });
      }
    }

    return NextResponse.json({ results });

  } catch (error) {
    console.error('Error getting multiple vote results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}