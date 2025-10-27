import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { sql } = await request.json();

    const supabaseAdmin = createServerSupabaseClient();

    // Execute the SQL directly
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql doesn't exist, try direct query
      const result = await supabaseAdmin.from('_sql').select('*').limit(0);
      
      return NextResponse.json({
        success: false,
        error: error.message,
        note: 'Execute SQL in Supabase dashboard directly'
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
