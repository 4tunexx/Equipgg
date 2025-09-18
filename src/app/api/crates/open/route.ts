import { NextRequest, NextResponse } from "next/server";
import { supabase } from '@/lib/supabase';
import { createSupabaseQueries } from '@/lib/supabase/queries';

const queries = createSupabaseQueries(supabase);

export async function POST(request: NextRequest) {
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
    const { crateId } = await request.json();

    if (!crateId) {
      return NextResponse.json(
        { error: 'Crate ID is required' },
        { status: 400 }
      );
    }

    // Open the crate
    const result = await queries.openCrate(userId, crateId);
    
    return NextResponse.json({ 
      success: true,
      item: result.item,
      remainingCoins: result.remainingCoins,
      message: 'Crate opened successfully'
    });

  } catch (error) {
    console.error('Error opening crate:', error);
    
    if (error.message === 'Insufficient coins') {
      return NextResponse.json(
        { error: 'Insufficient coins to open this crate' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to open crate' },
      { status: 500 }
    );
  }
}
