import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../lib/supabase";
import { getAuthSession } from "../../../lib/auth-utils";

// GET /api/trades - Get user's trades (sent, received, or all)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // sent, received, all
    const status = searchParams.get('status'); // pending, completed, declined, cancelled

    let query = supabase
      .from('trade_offers')
      .select(`
        *,
        sender:users!trade_offers_sender_id_fkey(id, displayname, avatar_url),
        receiver:users!trade_offers_receiver_id_fkey(id, displayname, avatar_url)
      `)
      .order('created_at', { ascending: false });

    // Filter by type
    if (type === 'sent') {
      query = query.eq('sender_id', session.user_id);
    } else if (type === 'received') {
      query = query.eq('receiver_id', session.user_id);
    } else {
      query = query.or(`sender_id.eq.${session.user_id},receiver_id.eq.${session.user_id}`);
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    }

    const { data: trades, error } = await query;

    if (error) {
      console.error('Error fetching trades:', error);
      return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
    }

    // Get item details for each trade
    const tradesWithItems = await Promise.all(trades.map(async (trade) => {
      const offeredItemIds = trade.sender_items || [];
      const requestedItemIds = trade.receiver_items || [];

      let offeredItems: any[] = [];
      let requestedItems: any[] = [];

      if (offeredItemIds.length > 0) {
        const { data } = await supabase
          .from('user_inventory')
          .select('id, item_name, item_type, rarity, image_url, value')
          .in('id', offeredItemIds);
        offeredItems = data || [];
      }

      if (requestedItemIds.length > 0) {
        const { data } = await supabase
          .from('user_inventory')
          .select('id, item_name, item_type, rarity, image_url, value')
          .in('id', requestedItemIds);
        requestedItems = data || [];
      }

      return {
        ...trade,
        offeredItemsDetails: offeredItems,
        requestedItemsDetails: requestedItems
      };
    }));

    return NextResponse.json({
      success: true,
      trades: tradesWithItems
    });

  } catch (error) {
    console.error('Get trades error:', error);
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
  }
}
