import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '../../../../lib/auth-utils';
import { supabase } from "../../../../lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: history, error: historyError } = await supabase
      .from('user_bets')
      .select('*')
      .eq('user_id', session.user_id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (historyError) {
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching user history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
