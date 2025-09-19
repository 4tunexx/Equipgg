import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Get upcoming matches from Supabase
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(20);

    if (error) {
      // If table doesn't exist, return mock match data
      if (error.code === '42P01') {
        const now = new Date();
        return NextResponse.json([
          {
            id: '1',
            team1: 'Natus Vincere',
            team2: 'G2 Esports',
            team1_logo: '/assets/teams/navi.png',
            team2_logo: '/assets/teams/g2.png',
            scheduled_at: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
            tournament: 'BLAST Premier',
            status: 'upcoming',
            odds: {
              team1: 1.85,
              team2: 1.95
            }
          },
          {
            id: '2',
            team1: 'FaZe Clan',
            team2: 'Astralis',
            team1_logo: '/assets/teams/faze.png',
            team2_logo: '/assets/teams/astralis.png',
            scheduled_at: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
            tournament: 'ESL Pro League',
            status: 'upcoming',
            odds: {
              team1: 1.75,
              team2: 2.05
            }
          },
          {
            id: '3',
            team1: 'Team Liquid',
            team2: 'MOUZ',
            team1_logo: '/assets/teams/liquid.png',
            team2_logo: '/assets/teams/mouz.png',
            scheduled_at: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
            tournament: 'IEM Cologne',
            status: 'upcoming',
            odds: {
              team1: 2.10,
              team2: 1.70
            }
          }
        ]);
      }
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json({ 
      error: "Unable to fetch matches" 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    error: "Method not allowed" 
  }, { status: 405 });
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ 
    error: "Method not allowed" 
  }, { status: 405 });
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ 
    error: "Method not allowed" 
  }, { status: 405 });
}
