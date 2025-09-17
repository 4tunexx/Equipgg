import { NextResponse } from 'next/server';
import { getDb, getAll } from '@/lib/db';

interface Team {
  id: string;
  name: string;
  logo: string;
  odds: number;
}

interface Match {
  id: string;
  team1: Team;
  team2: Team;
  status: 'upcoming' | 'live' | 'finished';
  time: string;
  tournament?: string;
  winner?: string;
  stream_url?: string;
}

export async function GET() {
  try {
    // Ensure database is loaded
    await getDb();
    
    // Get matches from database
    const dbMatches = getAll(`
      SELECT * FROM matches 
      WHERE status IN ('upcoming', 'live', 'completed')
      ORDER BY 
        CASE 
          WHEN status = 'live' THEN 1
          WHEN status = 'upcoming' THEN 2
          WHEN status = 'completed' THEN 3
        END,
        start_time ASC
      LIMIT 20
    `);

    // Convert database matches to API format
    const matches: Match[] = dbMatches.map((match: any) => ({
      id: match.id,
      team1: {
        id: match.team_a_name.toLowerCase().replace(/\s+/g, '-'),
        name: match.team_a_name,
        logo: match.team_a_logo || '/default-team-logo.svg',
        odds: match.team_a_odds || 1.5
      },
      team2: {
        id: match.team_b_name.toLowerCase().replace(/\s+/g, '-'),
        name: match.team_b_name,
        logo: match.team_b_logo || '/default-team-logo.svg',
        odds: match.team_b_odds || 1.5
      },
      status: match.status === 'completed' ? 'finished' : match.status,
      time: match.start_time || match.created_at,
      tournament: match.event_name,
      winner: match.winner,
      stream_url: match.stream_url
    }));

    // If no matches in database, return empty array
    if (matches.length === 0) {
      return NextResponse.json([]);
    }

    return NextResponse.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}