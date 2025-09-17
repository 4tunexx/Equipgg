import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth-utils';
import { getDb, run } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return createUnauthorizedResponse();
    }

    if (session.role !== 'admin') {
      return createForbiddenResponse('Only admins can seed matches');
    }

    console.log('🏆 Seeding matches...');
    const db = await getDb();

    // Clear existing matches
    await run('DELETE FROM matches');
    console.log('✅ Cleared existing matches');

    // Real CS2 matches with proper teams and tournaments
    const realMatches = [
      {
        id: 'match-nav-g2-1',
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
        id: 'match-ast-vit-1',
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
        id: 'match-fnc-faze-1',
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
      },
      {
        id: 'match-mouz-spirit-1',
        team_a_name: 'MOUZ',
        team_a_logo: 'https://img-cdn.hltv.org/teamlogo/4494.png',
        team_a_odds: 1.45,
        team_b_name: 'Team Spirit',
        team_b_logo: 'https://img-cdn.hltv.org/teamlogo/7020.png',
        team_b_odds: 2.65,
        event_name: 'PGL Major Copenhagen 2024',
        start_time: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours from now
        match_date: new Date().toISOString().split('T')[0],
        stream_url: 'https://www.twitch.tv/pgl',
        status: 'upcoming',
        winner: null,
        pandascore_id: 1004,
        created_at: new Date().toISOString()
      },
      {
        id: 'match-liquid-cloud9-1',
        team_a_name: 'Team Liquid',
        team_a_logo: 'https://img-cdn.hltv.org/teamlogo/5973.png',
        team_a_odds: 1.90,
        team_b_name: 'Cloud9',
        team_b_logo: 'https://img-cdn.hltv.org/teamlogo/5752.png',
        team_b_odds: 1.85,
        event_name: 'ESL Pro League Season 19',
        start_time: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(), // 10 hours from now
        match_date: new Date().toISOString().split('T')[0],
        stream_url: 'https://www.twitch.tv/esl_csgo',
        status: 'upcoming',
        winner: null,
        pandascore_id: 1005,
        created_at: new Date().toISOString()
      },
      {
        id: 'match-heroic-nip-1',
        team_a_name: 'Heroic',
        team_a_logo: 'https://img-cdn.hltv.org/teamlogo/7175.png',
        team_a_odds: 1.75,
        team_b_name: 'Ninjas in Pyjamas',
        team_b_logo: 'https://img-cdn.hltv.org/teamlogo/4411.png',
        team_b_odds: 2.00,
        event_name: 'IEM Katowice 2024',
        start_time: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now
        match_date: new Date().toISOString().split('T')[0],
        stream_url: 'https://www.twitch.tv/esl_csgo',
        status: 'upcoming',
        winner: null,
        pandascore_id: 1006,
        created_at: new Date().toISOString()
      },
      {
        id: 'match-completed-1',
        team_a_name: 'NAVI',
        team_a_logo: 'https://img-cdn.hltv.org/teamlogo/4608.png',
        team_a_odds: 1.50,
        team_b_name: 'G2 Esports',
        team_b_logo: 'https://img-cdn.hltv.org/teamlogo/5995.png',
        team_b_odds: 2.50,
        event_name: 'ESL Pro League Season 19',
        start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        match_date: new Date().toISOString().split('T')[0],
        stream_url: 'https://www.twitch.tv/esl_csgo',
        status: 'completed',
        winner: 'NAVI',
        pandascore_id: 1007,
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'match-live-1',
        team_a_name: 'Astralis',
        team_a_logo: 'https://img-cdn.hltv.org/teamlogo/6665.png',
        team_a_odds: 1.60,
        team_b_name: 'Vitality',
        team_b_logo: 'https://img-cdn.hltv.org/teamlogo/9565.png',
        team_b_odds: 2.25,
        event_name: 'IEM Katowice 2024',
        start_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        match_date: new Date().toISOString().split('T')[0],
        stream_url: 'https://www.twitch.tv/esl_csgo',
        status: 'live',
        winner: null,
        pandascore_id: 1008,
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
      }
    ];

    // Insert matches
    for (const match of realMatches) {
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

    console.log(`✅ Seeded ${realMatches.length} matches`);
    
    // Persist changes
    await db.export();
    console.log('✅ Database changes persisted');

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${realMatches.length} matches`,
      matches: realMatches.length,
      upcoming: realMatches.filter(m => m.status === 'upcoming').length,
      live: realMatches.filter(m => m.status === 'live').length,
      completed: realMatches.filter(m => m.status === 'completed').length
    });

  } catch (error) {
    console.error('❌ Error seeding matches:', error);
    return NextResponse.json(
      { error: 'Failed to seed matches' },
      { status: 500 }
    );
  }
}

