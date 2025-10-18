import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getAuthSession } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get authenticated session
    const session = await getAuthSession(request);
    
    console.log('Missions endpoint - auth check:', { userId: session?.user_id });
    
    // If no session, return unauthorized
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
