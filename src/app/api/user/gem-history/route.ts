import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getAuthSession } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    // Fetch gem transactions from various sources
    const { data: gemTransactions, error } = await supabase
      .from('gem_transactions')
      .select('*')
      .eq('user_id', session.user_id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching gem history:', error);
    }

    return NextResponse.json({
      success: true,
      transactions: gemTransactions || [],
      totalTransactions: gemTransactions?.length || 0
    });

  } catch (error) {
    console.error('Gem history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

