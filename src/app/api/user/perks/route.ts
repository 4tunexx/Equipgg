import { NextRequest, NextResponse } from "next/server";
import { supabase } from '@/lib/supabase';

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

    // Get user perks from Supabase
    const { data: perks, error: perksError } = await supabase
      .from('user_perks')
      .select('*, perk:perks(*)')
      .eq('user_id', userId)
      .eq('active', true);

    if (perksError) {
      console.error('Error fetching user perks:', perksError);
      return NextResponse.json(
        { error: 'Failed to fetch perks' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      perks: perks || []
    });

  } catch (error) {
    console.error('Error fetching user perks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
