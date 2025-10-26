import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../../../lib/supabase";
import { getAuthSession } from "../../../../../lib/auth-utils";
import { createNotification } from "../../../../../lib/notification-utils";
import { addXp } from "../../../../../lib/xp-leveling-system";
import { trackMissionProgress } from "../../../../../lib/mission-integration";

// POST /api/trades/[tradeId]/accept - Accept a trade offer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { tradeId } = await params;

    // Get trade details
    const { data: trade, error: tradeError } = await supabase
      .from('trade_offers')
      .select('*')
      .eq('id', tradeId)
      .single();

    if (tradeError || !trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    // Verify user is the trade creator (sender)
    if (trade.sender_id !== session.user_id) {
      return NextResponse.json({ error: 'Only the trade creator can accept offers' }, { status: 403 });
    }

    // Verify someone made an offer
    if (!trade.receiver_id) {
      return NextResponse.json({ error: 'No offers have been made on this trade yet' }, { status: 400 });
    }

    // Verify trade is still pending
    if (trade.status !== 'pending') {
      return NextResponse.json({ error: `Trade is already ${trade.status}` }, { status: 400 });
    }

    // Verify both users still own their items
    const offeredItems = trade.sender_items || [];
    const requestedItems = trade.receiver_items || [];

    if (offeredItems.length > 0) {
      const { data: senderItems } = await supabase
        .from('user_inventory')
        .select('id')
        .in('id', offeredItems)
        .eq('user_id', trade.sender_id);

      if (!senderItems || senderItems.length !== offeredItems.length) {
        await supabase.from('trade_offers').update({ status: 'cancelled' }).eq('id', tradeId);
        return NextResponse.json({ error: 'Sender no longer owns all offered items' }, { status: 400 });
      }
    }

    if (requestedItems.length > 0) {
      const { data: receiverItems } = await supabase
        .from('user_inventory')
        .select('id')
        .in('id', requestedItems)
        .eq('user_id', trade.receiver_id); // FIX: Check receiver owns their items, not sender!

      if (!receiverItems || receiverItems.length !== requestedItems.length) {
        await supabase.from('trade_offers').update({ status: 'cancelled' }).eq('id', tradeId);
        return NextResponse.json({ error: 'Receiver no longer owns all requested items' }, { status: 400 });
      }
    }

    // Execute trade - swap item ownership
    // Sender's items go to receiver
    if (offeredItems.length > 0) {
      await supabase
        .from('user_inventory')
        .update({ 
          user_id: trade.receiver_id,
          equipped: false,
          obtained_from: 'trade'
        })
        .in('id', offeredItems);
    }

    // Receiver's items go to sender
    if (requestedItems.length > 0) {
      await supabase
        .from('user_inventory')
        .update({ 
          user_id: trade.sender_id,
          equipped: false,
          obtained_from: 'trade'
        })
        .in('id', requestedItems);
    }

    // Update trade status
    await supabase
      .from('trade_offers')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', tradeId);

    // Award XP to both users
    try {
      await addXp(session.user_id, 15, 'trade_completed');
      await addXp(trade.sender_id, 15, 'trade_completed');
      await trackMissionProgress(session.user_id, 'trade_completed', 1);
      await trackMissionProgress(trade.sender_id, 'trade_completed', 1);
    } catch (xpError) {
      console.warn('Failed to award XP for trade:', xpError);
    }

    // Get sender (trade creator) info
    const { data: sender } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', session.user_id)
      .single();

    // Clear old trade notifications for both users
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('type', 'trade_offer_received')
      .eq('user_id', session.user_id)
      .contains('data', { tradeId: trade.id });

    // Notify the person who made the offer (receiver)
    await createNotification({
      userId: trade.receiver_id,
      type: 'trade_accepted',
      title: '✅ Trade Accepted!',
      message: `${sender?.display_name || 'Someone'} accepted your offer! Items have been swapped.`,
      data: {
        tradeId: trade.id,
        senderId: session.user_id
      }
    });

    console.log('✅ Trade completed successfully:', {
      tradeId: trade.id,
      sender: trade.sender_id,
      receiver: trade.receiver_id,
      itemsExchanged: true
    });

    return NextResponse.json({
      success: true,
      message: 'Trade completed successfully! Items have been exchanged.',
      trade: { ...trade, status: 'completed' }
    });

  } catch (error) {
    console.error('Accept trade error:', error);
    return NextResponse.json({ error: 'Failed to accept trade' }, { status: 500 });
  }
}
