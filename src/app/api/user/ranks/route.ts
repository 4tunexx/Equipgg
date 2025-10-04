import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createServerSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from session cookie
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    console.log('Ranks endpoint - auth check:', { user: user?.id, error: authError });
    
    if (authError || !user) {
      console.log('Ranks endpoint - unauthorized:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // Get all ranks for progression display (no filters to ensure we get all 50)
    const { data: allRanks, error: ranksError } = await supabase
      .from('ranks')
      .select('*')
      .order('id', { ascending: true })
      .limit(100)  // Explicit limit to ensure all ranks are returned

    console.log('Ranks query result:', { count: allRanks?.length, error: ranksError });

    if (ranksError) {
      console.error('Error fetching ranks:', ranksError)
      return NextResponse.json({ 
        error: 'Database error', 
        details: ranksError.message,
        code: ranksError.code 
      }, { status: 500 })
    }

    if (!allRanks || allRanks.length === 0) {
      console.log('No ranks found in database');
      return NextResponse.json({ 
        error: 'No ranks found',
        details: 'Database returned empty result'
      }, { status: 404 })
    }

    console.log('Sample ranks data:', allRanks.slice(0, 2));

    // Determine current rank based on user level
    const userLevel = user?.level || 1
    
    // Find field that represents level requirement (try common field names)
    const sampleRank = allRanks[0];
    const levelField = sampleRank.min_level !== undefined ? 'min_level' : 
                      sampleRank.level_required !== undefined ? 'level_required' : 
                      sampleRank.level !== undefined ? 'level' : 'rank_number';
                      
    console.log('Using level field:', levelField, 'Sample value:', sampleRank[levelField]);

    return NextResponse.json({
      success: true,
      user_level: userLevel,
      total_ranks: allRanks.length,
      ranks: allRanks,
      level_field_used: levelField,
      sample_rank: allRanks[0]
    })

  } catch (error) {
    console.error('Ranks API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}