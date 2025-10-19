import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../../../lib/supabase";
import { getAuthSession } from "../../../../../lib/auth-utils";
import { createNotification } from "../../../../../lib/notification-utils";

// POST /api/trades/[tradeId]/cancel - Cancel a trade offer (sender or admin)
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
    const { reason } = await request.json();

    // Get trade details
    const { data: trade, error: tradeError } = await supabase
      .from('trade_offers')
      .select('*')
      .eq('id', tradeId)
      .single();

    if (tradeError || !trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    // Get user role
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user_id)
      .single();

    const isAdmin = user?.role === 'admin' || user?.role === 'moderator';
    const isSender = trade.sender_id === session.user_id;

    // Verify user is sender or admin
    if (!isSender && !isAdmin) {
      return NextResponse.json({ error: 'You are not authorized to cancel this trade' }, { status: 403 });
    }

    // Verify trade is still pending
    if (trade.status !== 'pending') {
      return NextResponse.json({ error: `Trade is already ${trade.status}` }, { status: 400 });
    }

    // Update trade status
    await supabase
      .from('trade_offers')
      .update({ 
        status: 'cancelled',
        cancelled_by: session.user_id
      })
      .eq('id', tradeId);

    // Notify both parties
    if (isAdmin && !isSender) {
      // Admin cancelled - notify both
      await createNotification({
        userId: trade.sender_id,
        type: 'trade_cancelled',
        title: '⚠️ Trade Cancelled by Admin',
        message: reason || 'Your trade was cancelled by a moderator',
        data: { tradeId: trade.id }
      });

      await createNotification({
        userId: trade.receiver_id,
        type: 'trade_cancelled',
        title: '⚠️ Trade Cancelled by Admin',
        message: reason || 'A trade offer was cancelled by a moderator',
        data: { tradeId: trade.id }
      });
    } else {
      // Sender cancelled - notify recipient
      const { data: sender } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', session.user_id)
        .single();

      await createNotification({
        userId: trade.recipient_id,
        type: 'trade_cancelled',
        title: '❌ Trade Cancelled',
        message: `${sender?.display_name || 'Someone'} cancelled their trade offer`,
        data: { tradeId: trade.id }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Trade cancelled'
    });

  } catch (error) {
    console.error('Cancel trade error:', error);
    return NextResponse.json({ error: 'Failed to cancel trade' }, { status: 500 });
  }
}
