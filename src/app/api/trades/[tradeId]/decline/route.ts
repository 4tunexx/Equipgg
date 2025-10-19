import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../../../lib/supabase";
import { getAuthSession } from "../../../../../lib/auth-utils";
import { createNotification } from "../../../../../lib/notification-utils";

// POST /api/trades/[tradeId]/decline - Decline a trade offer
export async function POST(
  request: NextRequest,
  { params }: { params: { tradeId: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { tradeId } = params;

    // Get trade details
    const { data: trade, error: tradeError } = await supabase
      .from('trade_offers')
      .select('*')
      .eq('id', tradeId)
      .single();

    if (tradeError || !trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    // Verify user is the receiver
    if (trade.receiver_id !== session.user_id) {
      return NextResponse.json({ error: 'You are not authorized to decline this trade' }, { status: 403 });
    }

    // Verify trade is still pending
    if (trade.status !== 'pending') {
      return NextResponse.json({ error: `Trade is already ${trade.status}` }, { status: 400 });
    }

    // Update trade status
    await supabase
      .from('trade_offers')
      .update({ status: 'declined' })
      .eq('id', tradeId);

    // Get recipient info
    const { data: recipient } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', session.user_id)
      .single();

    // Notify sender
    await createNotification({
      userId: trade.sender_id,
      type: 'trade_declined',
      title: '❌ Trade Declined',
      message: `${recipient?.display_name || 'Someone'} declined your trade offer`,
      data: {
        tradeId: trade.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Trade declined'
    });

  } catch (error) {
    console.error('Decline trade error:', error);
    return NextResponse.json({ error: 'Failed to decline trade' }, { status: 500 });
  }
}
