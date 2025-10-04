import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createServerSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from session cookie
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    console.log('Missions endpoint - auth check:', { user: user?.id, error: authError });
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    const { data: missions, error: missionsError } = await supabase
      .from('missions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    console.log('Missions query result:', { count: missions?.length, error: missionsError });

    if (missionsError) {
      console.error('Missions error:', missionsError)
      return NextResponse.json({ error: 'Failed to fetch missions' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      missions: missions || []
    })

  } catch (error) {
    console.error('Error fetching missions:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
