import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Try to get user from custom session cookie
    const cookieHeader = request.headers.get('cookie') || '';
    const cookieMatch = cookieHeader.match(/equipgg_session=([^;]+)/);
    
    let userId: string | null = null;
    
    if (cookieMatch) {
      try {
        const sessionData = JSON.parse(decodeURIComponent(cookieMatch[1]));
        if (sessionData.user_id && (!sessionData.expires_at || Date.now() < sessionData.expires_at)) {
          userId = sessionData.user_id;
        }
      } catch (e) {
        console.error('Failed to parse session cookie:', e);
      }
    }
    
    console.log('Missions endpoint - auth check:', { userId });
    
    // If no custom session, return unauthorized
    if (!userId) {
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
