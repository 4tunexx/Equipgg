import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../../../lib/supabase";
import { getAuthSession } from "../../../../../lib/auth-utils";
import { createNotification } from "../../../../../lib/notification-utils";

// POST /api/trades/[tradeId]/offer - Make an offer on an open trade
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
    const { itemId } = await request.json();

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    // Get trade details
    const { data: trade, error: tradeError } = await supabase
      .from('trade_offers')
      .select('*')
      .eq('id', tradeId)
      .single();

    if (tradeError || !trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    // Verify trade is open
    if (trade.status !== 'open') {
      return NextResponse.json({ error: 'This trade is no longer accepting offers' }, { status: 400 });
    }

    // Cannot make offer on your own trade
    if (trade.sender_id === session.user_id) {
      return NextResponse.json({ error: 'Cannot make an offer on your own trade' }, { status: 400 });
    }

    // ANTI-CHEAT: Verify user owns the item and it's not equipped or already in a trade
    const { data: item, error: itemError } = await supabase
      .from('user_inventory')
      .select('id, equipped, in_escrow, item_name')
      .eq('id', itemId)
      .eq('user_id', session.user_id)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item not found in your inventory' }, { status: 400 });
    }

    if (item.equipped) {
      return NextResponse.json({ error: 'Cannot trade equipped items. Please unequip it first.' }, { status: 400 });
    }
    
    // ANTI-CHEAT: Check if item is already in escrow
    if (item.in_escrow) {
      return NextResponse.json({ error: 'This item is already in an active trade' }, { status: 400 });
    }
    
    // ANTI-CHEAT: Check if item is in any other active trades
    const { data: activeTrades } = await supabase
      .from('trade_offers')
      .select('id')
      .or(`sender_items.cs.{${itemId}},receiver_items.cs.{${itemId}}`)
      .in('status', ['open', 'pending'])
      .neq('id', tradeId) // Exclude current trade
      .limit(1);
    
    if (activeTrades && activeTrades.length > 0) {
      return NextResponse.json({ error: 'This item is already in another active trade' }, { status: 400 });
    }

    // Update trade with offer
    const { error: updateError } = await supabase
      .from('trade_offers')
      .update({
        receiver_id: session.user_id,
        receiver_items: [itemId],
        status: 'pending' // Change to pending when offer is made
      })
      .eq('id', tradeId);

    if (updateError) {
      console.error('Error updating trade:', updateError);
      return NextResponse.json({ error: 'Failed to make offer' }, { status: 500 });
    }

    // Get offerer info
    const { data: offerer } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', session.user_id)
      .single();

    // Notify trade creator
    await createNotification({
      userId: trade.sender_id,
      type: 'trade_offer_received',
      title: '📦 New Trade Offer!',
      message: `${offerer?.display_name || 'Someone'} made an offer on your trade`,
      data: {
        tradeId: trade.id,
        offererId: session.user_id,
        offererName: offerer?.display_name,
        itemName: item.item_name
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Offer sent! Waiting for the trade creator to accept.'
    });

  } catch (error) {
    console.error('Make offer error:', error);
    return NextResponse.json({ error: 'Failed to make offer' }, { status: 500 });
  }
}
