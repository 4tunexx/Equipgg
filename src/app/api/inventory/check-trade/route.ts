import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../../lib/supabase";
import { getAuthSession } from "../../../../lib/auth-utils";

// POST /api/inventory/check-trade - Check if item is in an active trade
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { itemId } = await request.json();

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    // Check if item is in any active trade (open or pending)
    const { data: trades, error } = await supabase
      .from('trade_offers')
      .select('id, status')
      .or(`sender_items.cs.{${itemId}},receiver_items.cs.{${itemId}}`)
      .in('status', ['open', 'pending']);

    if (error) {
      console.error('Error checking trades:', error);
      return NextResponse.json({ error: 'Failed to check trades' }, { status: 500 });
    }

    const isInTrade = trades && trades.length > 0;

    return NextResponse.json({
      success: true,
      isInTrade,
      tradeId: isInTrade ? trades[0].id : null,
      message: isInTrade ? 'This item is in an active trade. Please cancel the trade first.' : 'Item is not in any trade'
    });

  } catch (error) {
    console.error('Check trade error:', error);
    return NextResponse.json({ error: 'Failed to check trade status' }, { status: 500 });
  }
}
