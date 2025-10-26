import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from '../../../../lib/auth-utils';
import { supabase } from "../../../../lib/supabase";

// Admin-only: Create test matches for development
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

    const { count = 5 } = await request.json();

    if (count > 20) {
      return NextResponse.json({ 
        error: 'Cannot create more than 20 test matches at once' 
      }, { status: 400 });
    }

    const teams = [
      'Astralis', 'FaZe Clan', 'NAVI', 'G2 Esports', 'Liquid',
      'Vitality', 'Heroic', 'FURIA', 'Cloud9', 'NIP',
      'Movistar Riders', 'BIG', 'Spirit', 'Outsiders', 'ENCE'
    ];

    const tournaments = [
      'ESL Pro League', 'BLAST Premier', 'IEM Katowice', 'PGL Major',
      'DreamHack', 'ESEA League', 'Flashpoint', 'WePlay'
    ];

    const testMatches: Array<{
      id: string;
      title: string;
      team1_name: string;
      team2_name: string;
      tournament: string;
      status: string;
      scheduled_at: any;
      completed_at: any;
      result: string | null;
      team1_score: number | null;
      team2_score: number | null;
      map_pool: string[];
      created_at: string;
      updated_at: string;
    }> = [];
    const timestamp = Date.now();

    for (let i = 1; i <= count; i++) {
      const team1 = teams[Math.floor(Math.random() * teams.length)];
      let team2 = teams[Math.floor(Math.random() * teams.length)];
      while (team2 === team1) {
        team2 = teams[Math.floor(Math.random() * teams.length)];
      }

      const tournament = tournaments[Math.floor(Math.random() * tournaments.length)];
      const statuses = ['upcoming', 'live', 'completed'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      let scheduledAt, completedAt;
      let result: string | null = null;
      
      if (status === 'upcoming') {
        // Future matches
        scheduledAt = new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (status === 'live') {
        // Current matches
        scheduledAt = new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000).toISOString();
      } else {
        // Completed matches
        scheduledAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
        completedAt = new Date(Date.now() - Math.random() * 29 * 24 * 60 * 60 * 1000).toISOString();
        result = Math.random() > 0.5 ? 'team1' : 'team2';
      }

      const testMatch = {
        id: `test_match_${timestamp}_${i}`,
        title: `${team1} vs ${team2}`,
        team1_name: team1,
        team2_name: team2,
        tournament,
        status,
        scheduled_at: scheduledAt,
        completed_at: completedAt,
        result,
        team1_score: status === 'completed' ? Math.floor(Math.random() * 3) : null,
        team2_score: status === 'completed' ? Math.floor(Math.random() * 3) : null,
        map_pool: ['dust2', 'mirage', 'inferno', 'overpass', 'vertigo', 'ancient', 'nuke'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      testMatches.push(testMatch);
    }

    // Insert test matches
    const { data: createdMatches, error: createError } = await supabase
      .from('matches')
      .insert(testMatches)
      .select();

    if (createError) {
      if (createError.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          message: `Would create ${count} test matches (matches table not found)`,
          matches: testMatches.map(m => ({ 
            id: m.id, 
            title: m.title, 
            status: m.status,
            scheduled_at: m.scheduled_at 
          }))
        });
      }
      console.error('Error creating test matches:', createError);
      return NextResponse.json({ error: 'Failed to create test matches' }, { status: 500 });
    }

    // Create some test predictions for completed matches
    const completedMatches = createdMatches.filter((m: any) => m.status === 'completed');
    if (completedMatches.length > 0) {
      // Get some users to create predictions for
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .limit(10);

      if (users && users.length > 0) {
        const testPredictions: Array<{
          user_id: any;
          match_id: any;
          prediction: string;
          created_at: string;
        }> = [];
        for (const match of completedMatches) {
          const predictionCount = Math.floor(Math.random() * users.length) + 1;
          const shuffledUsers = users.sort(() => 0.5 - Math.random()).slice(0, predictionCount);
          
          for (const user of shuffledUsers) {
            testPredictions.push({
              user_id: user.id,
              match_id: match.id,
              prediction: Math.random() > 0.5 ? 'team1' : 'team2',
              created_at: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
            });
          }
        }

        const { error: predictionError } = await supabase
          .from('match_predictions')
          .insert(testPredictions);

        if (predictionError && predictionError.code !== 'PGRST116') {
          console.error('Error creating test predictions:', predictionError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdMatches.length} test matches with predictions`,
      matches: createdMatches.map((m: any) => ({ 
        id: m.id, 
        title: m.title, 
        status: m.status,
        scheduled_at: m.scheduled_at,
        tournament: m.tournament 
      }))
    });

  } catch (error) {
    console.error('Error creating test matches:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Admin-only: Get test matches
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const testOnly = searchParams.get('test_only') === 'true';

    let query = supabase
      .from('matches')
      .select(`
        id,
        title,
        team1_name,
        team2_name,
        tournament,
        status,
        scheduled_at,
        completed_at,
        result,
        team1_score,
        team2_score,
        created_at,
        match_predictions (count)
      `)
      .order('scheduled_at', { ascending: false });

    if (testOnly) {
      query = query.like('id', 'test_match_%');
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: matches, error: matchesError } = await query;

    if (matchesError) {
      if (matchesError.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          matches: [
            {
              id: 'test_match_example_1',
              title: 'Astralis vs FaZe Clan',
              team1_name: 'Astralis',
              team2_name: 'FaZe Clan',
              tournament: 'ESL Pro League',
              status: 'upcoming',
              scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString()
            }
          ],
          total: 1,
          message: 'Matches table not found - showing example data'
        });
      }
      console.error('Error fetching matches:', matchesError);
      return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      matches,
      total: matches?.length || 0
    });

  } catch (error) {
    console.error('Error fetching test matches:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Admin-only: Delete test matches
export async function DELETE(request: NextRequest) {
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

    const { testMatchesOnly = true } = await request.json();

    if (!testMatchesOnly) {
      return NextResponse.json({ 
        error: 'Deleting all matches requires manual confirmation' 
      }, { status: 400 });
    }

    // Delete related predictions first
    const { data: testMatches } = await supabase
      .from('matches')
      .select('id')
      .like('id', 'test_match_%');

    if (testMatches && testMatches.length > 0) {
      const matchIds = testMatches.map((m: any) => m.id);
      
      const { error: predictionError } = await supabase
        .from('match_predictions')
        .delete()
        .in('match_id', matchIds);

      if (predictionError && predictionError.code !== 'PGRST116') {
        console.error('Error deleting test predictions:', predictionError);
      }
    }

    // Delete test matches
    const { data: deletedMatches, error: deleteError } = await supabase
      .from('matches')
      .delete()
      .like('id', 'test_match_%')
      .select();

    if (deleteError) {
      if (deleteError.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          message: 'Test matches cleaned up (matches table not found)',
          deletedCount: 0
        });
      }
      console.error('Error deleting test matches:', deleteError);
      return NextResponse.json({ error: 'Failed to delete test matches' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedMatches?.length || 0} test matches and their predictions`,
      deletedCount: deletedMatches?.length || 0
    });

  } catch (error) {
    console.error('Error deleting test matches:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
