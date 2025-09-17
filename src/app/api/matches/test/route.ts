import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth-utils';
import { getDb, run } from '@/lib/db';

// POST /api/matches/test - Add test matches (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }
    
    // Check if user is admin
    if (session.role !== 'admin') {
      return createForbiddenResponse('Admin access required');
    }

    // Ensure database is loaded
    await getDb();

    // Test matches data
    const testMatches = [
      {
        id: 'match-1',
        team_a_name: 'NAVI',
        team_a_logo: 'https://img-cdn.hltv.org/teamlogo/4608.png',
        team_a_odds: 1.65,
        team_b_name: 'G2 Esports',
        team_b_logo: 'https://img-cdn.hltv.org/teamlogo/5995.png',
        team_b_odds: 2.20,
        event_name: 'ESL Pro League Season 19',
        start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        match_date: new Date().toISOString().split('T')[0],
        stream_url: 'https://www.twitch.tv/esl_csgo',
        status: 'upcoming',
        winner: null,
        pandascore_id: 1001,
        created_at: new Date().toISOString()
      },
      {
        id: 'match-2',
        team_a_name: 'Astralis',
        team_a_logo: 'https://img-cdn.hltv.org/teamlogo/6665.png',
        team_a_odds: 1.80,
        team_b_name: 'Vitality',
        team_b_logo: 'https://img-cdn.hltv.org/teamlogo/9565.png',
        team_b_odds: 1.95,
        event_name: 'IEM Katowice 2024',
        start_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
        match_date: new Date().toISOString().split('T')[0],
        stream_url: 'https://www.twitch.tv/esl_csgo',
        status: 'upcoming',
        winner: null,
        pandascore_id: 1002,
        created_at: new Date().toISOString()
      },
      {
        id: 'match-3',
        team_a_name: 'Fnatic',
        team_a_logo: 'https://img-cdn.hltv.org/teamlogo/4991.png',
        team_a_odds: 2.10,
        team_b_name: 'FaZe Clan',
        team_b_logo: 'https://img-cdn.hltv.org/teamlogo/6667.png',
        team_b_odds: 1.70,
        event_name: 'BLAST Premier Spring 2024',
        start_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
        match_date: new Date().toISOString().split('T')[0],
        stream_url: 'https://www.twitch.tv/blastpremier',
        status: 'upcoming',
        winner: null,
        pandascore_id: 1003,
        created_at: new Date().toISOString()
      }
    ];

    // Clear existing test matches
    await run('DELETE FROM matches WHERE id LIKE "match-%"');

    // Insert test matches
    for (const match of testMatches) {
      await run(`
        INSERT INTO matches (
          id, team_a_name, team_a_logo, team_a_odds,
          team_b_name, team_b_logo, team_b_odds,
          event_name, start_time, match_date,
          stream_url, status, winner, pandascore_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        match.id,
        match.team_a_name,
        match.team_a_logo,
        match.team_a_odds,
        match.team_b_name,
        match.team_b_logo,
        match.team_b_odds,
        match.event_name,
        match.start_time,
        match.match_date,
        match.stream_url,
        match.status,
        match.winner,
        match.pandascore_id,
        match.created_at
      ]);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Added ${testMatches.length} test matches`,
      matches: testMatches
    });
  } catch (error) {
    console.error('Error adding test matches:', error);
    return NextResponse.json({ 
      error: 'Failed to add test matches',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
