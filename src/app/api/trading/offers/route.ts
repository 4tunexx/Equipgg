import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from "../../../../lib/auth-utils";
import { supabase } from "../../../../lib/supabase";
import { v4 as uuidv4 } from 'uuid';

// Get trade offers for a user
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'incoming', 'outgoing', 'all'
    const status = searchParams.get('status') || 'all'; // 'pending', 'accepted', 'declined', 'cancelled', 'expired'

    let query = supabase
      .from('trade_offers')
      .select(`
        *,
        sender:sender_id(id, display_name, avatar_url, level),
        receiver:receiver_id(id, display_name, avatar_url, level),
        offered_items:trade_offer_items!trade_offer_items_offer_id_fkey(
          item_id,
          item:items(*)
        ),
        requested_items:trade_offer_requests(
          item_id,
          item:items(*)
        )
      `);

    if (type === 'incoming') {
      query = query.eq('receiver_id', session.user_id);
    } else if (type === 'outgoing') {
      query = query.eq('sender_id', session.user_id);
    } else {
      query = query.or(`sender_id.eq.${session.user_id},receiver_id.eq.${session.user_id}`);
    }

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: offers, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch trade offers' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      offers: offers || []
    });

  } catch (error) {
    console.error('Get trade offers error:', error);
    return NextResponse.json({ error: 'Failed to fetch trade offers' }, { status: 500 });
  }
}

// Create a new trade offer
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { receiverId, offeredItemIds, requestedItemIds, message } = await request.json();

    if (!receiverId || !offeredItemIds?.length) {
      return NextResponse.json({ 
        error: 'Receiver and offered items are required' 
      }, { status: 400 });
    }

    // Verify sender owns the offered items
    const { data: ownedItems, error: ownershipError } = await supabase
      .from('user_inventory')
      .select('item_id')
      .eq('user_id', session.user_id)
      .in('item_id', offeredItemIds);

    if (ownershipError || ownedItems?.length !== offeredItemIds.length) {
      return NextResponse.json({ 
        error: 'You do not own all the offered items' 
      }, { status: 400 });
    }

    // Create trade offer
    const offerId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const { error: offerError } = await supabase
      .from('trade_offers')
      .insert({
        id: offerId,
        sender_id: session.user_id,
        receiver_id: receiverId,
        status: 'pending',
        message: message || null,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      });

    if (offerError) {
      console.error('Failed to create trade offer:', offerError);
      return NextResponse.json({ error: 'Failed to create trade offer' }, { status: 500 });
    }

    // Add offered items
    const offeredItemsData = offeredItemIds.map((itemId: string) => ({
      id: uuidv4(),
      offer_id: offerId,
      item_id: itemId,
      type: 'offered'
    }));

    const { error: offeredError } = await supabase
      .from('trade_offer_items')
      .insert(offeredItemsData);

    if (offeredError) {
      console.error('Failed to add offered items:', offeredError);
      // Cleanup - delete the trade offer
      await supabase.from('trade_offers').delete().eq('id', offerId);
      return NextResponse.json({ error: 'Failed to create trade offer' }, { status: 500 });
    }

    // Add requested items if any
    if (requestedItemIds?.length) {
      const requestedItemsData = requestedItemIds.map((itemId: string) => ({
        id: uuidv4(),
        offer_id: offerId,
        item_id: itemId,
        type: 'requested'
      }));

      const { error: requestedError } = await supabase
        .from('trade_offer_requests')
        .insert(requestedItemsData);

      if (requestedError) {
        console.error('Failed to add requested items:', requestedError);
        // Continue anyway, requested items are optional
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Trade offer created successfully',
      offerId
    });

  } catch (error) {
    console.error('Create trade offer error:', error);
    return NextResponse.json({ error: 'Failed to create trade offer' }, { status: 500 });
  }
}

// Accept/Decline a trade offer
export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { offerId, action } = await request.json(); // action: 'accept' | 'decline' | 'cancel'

    if (!offerId || !['accept', 'decline', 'cancel'].includes(action)) {
      return NextResponse.json({ 
        error: 'Valid offer ID and action are required' 
      }, { status: 400 });
    }

    // Get the trade offer
    const { data: offer, error: fetchError } = await supabase
      .from('trade_offers')
      .select(`
        *,
        offered_items:trade_offer_items!trade_offer_items_offer_id_fkey(item_id),
        requested_items:trade_offer_requests(item_id)
      `)
      .eq('id', offerId)
      .single();

    if (fetchError || !offer) {
      return NextResponse.json({ error: 'Trade offer not found' }, { status: 404 });
    }

    // Verify user can perform this action
    if (action === 'cancel' && offer.sender_id !== session.user_id) {
      return NextResponse.json({ error: 'Only sender can cancel' }, { status: 403 });
    }
    if ((action === 'accept' || action === 'decline') && offer.receiver_id !== session.user_id) {
      return NextResponse.json({ error: 'Only receiver can accept/decline' }, { status: 403 });
    }

    // Check if offer is still pending
    if (offer.status !== 'pending') {
      return NextResponse.json({ 
        error: `Trade offer is already ${offer.status}` 
      }, { status: 400 });
    }

    // Check if offer has expired
    if (new Date(offer.expires_at) < new Date()) {
      await supabase
        .from('trade_offers')
        .update({ status: 'expired' })
        .eq('id', offerId);
      
      return NextResponse.json({ 
        error: 'Trade offer has expired' 
      }, { status: 400 });
    }

    let newStatus = action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : 'cancelled';

    // If accepting, perform the item transfer
    if (action === 'accept') {
      // Start a transaction (simplified version)
      
      // Transfer offered items from sender to receiver
      const offeredItemIds = offer.offered_items.map((item: any) => item.item_id);
      if (offeredItemIds.length > 0) {
        await supabase
          .from('user_inventory')
          .update({ user_id: offer.receiver_id })
          .eq('user_id', offer.sender_id)
          .in('item_id', offeredItemIds);
      }

      // Transfer requested items from receiver to sender (if any)
      const requestedItemIds = offer.requested_items?.map((item: any) => item.item_id) || [];
      if (requestedItemIds.length > 0) {
        await supabase
          .from('user_inventory')
          .update({ user_id: offer.sender_id })
          .eq('user_id', offer.receiver_id)
          .in('item_id', requestedItemIds);
      }

      // Log the trade in history
      await supabase
        .from('trade_history')
        .insert({
          id: uuidv4(),
          offer_id: offerId,
          sender_id: offer.sender_id,
          receiver_id: offer.receiver_id,
          offered_items: JSON.stringify(offeredItemIds),
          requested_items: JSON.stringify(requestedItemIds),
          completed_at: new Date().toISOString()
        });
    }

    // Update offer status
    const { error: updateError } = await supabase
      .from('trade_offers')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', offerId);

    if (updateError) {
      console.error('Failed to update trade offer:', updateError);
      return NextResponse.json({ error: 'Failed to update trade offer' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Trade offer ${newStatus} successfully`,
      status: newStatus
    });

  } catch (error) {
    console.error('Update trade offer error:', error);
    return NextResponse.json({ error: 'Failed to update trade offer' }, { status: 500 });
  }
}