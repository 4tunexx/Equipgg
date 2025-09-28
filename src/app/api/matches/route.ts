import { NextRequest, NextResponse } from "next/server";
import { secureDb } from "../../../lib/secure-db";

export async function GET(request: NextRequest) {
  try {
    // Get visible upcoming matches from database
    const matches = await secureDb.findMany('matches', {
      is_visible: true,
      status: 'upcoming'
    }, {
      orderBy: 'match_date ASC',
      limit: 20
    });

    // Transform to the expected format for frontend compatibility
    const transformedMatches = matches.map((match: any) => ({
      id: match.id,
      team1: {
        name: match.team_a_name,
        logo: match.team_a_logo
      },
      team2: {
        name: match.team_b_name,
        logo: match.team_b_logo
      },
      scheduled_at: match.match_date && match.start_time
        ? new Date(`${match.match_date}T${match.start_time}`).toISOString()
        : new Date(match.match_date).toISOString(),
      tournament: match.event_name,
      status: match.status,
      odds: {
        team1: parseFloat(match.team_a_odds) || 1.5,
        team2: parseFloat(match.team_b_odds) || 2.5
      },
      map: match.map,
      stream_url: match.stream_url
    }));

    return NextResponse.json(transformedMatches);
  } catch (error) {
    console.error('Error fetching matches:', error);

    // Fallback to mock data if database is not available
    const now = new Date();
    return NextResponse.json([
      {
        id: '1',
        team1: {
          name: 'Natus Vincere',
          logo: '/assets/teams/navi.png'
        },
        team2: {
          name: 'G2 Esports',
          logo: '/assets/teams/g2.png'
        },
        scheduled_at: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        tournament: 'BLAST Premier',
        status: 'upcoming',
        odds: {
          team1: 1.85,
          team2: 2.5
        }
      },
      {
        id: '2',
        team1: {
          name: 'FaZe Clan',
          logo: '/assets/teams/faze.png'
        },
        team2: {
          name: 'Astralis',
          logo: '/assets/teams/astralis.png'
        },
        scheduled_at: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
        tournament: 'ESL Pro League',
        status: 'upcoming',
        odds: {
          team1: 1.75,
          team2: 2.05
        }
      }
    ]);
  }
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ 
    error: "Method not allowed" 
  }, { status: 405 });
}
