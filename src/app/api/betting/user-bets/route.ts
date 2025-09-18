import { NextRequest, NextResponse } from "next/server";
import { supabase } from '@/lib/supabase';
import { createSupabaseQueries } from '@/lib/supabase/queries';

const queries = createSupabaseQueries(supabase);

export async function GET(request: NextRequest) {
  try {
    // Get user session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get user bets from Supabase
    const bets = await queries.getUserBets(userId, limit);
    
    return NextResponse.json({ 
      success: true,
      bets 
    });

  } catch (error) {
    console.error('Error fetching user bets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bets' },
      { status: 500 }
    );
  }
}


