import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../../lib/supabase";
import { getAuthSession } from "../../../../lib/auth-utils";

// GET /api/admin/trades - Get all trades (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify admin/moderator
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user_id)
      .single();

    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    let query = supabase
      .from('trade_offers')
      .select(`
        *,
        sender:users!trade_offers_sender_id_fkey(id, displayname, avatar_url, role),
        receiver:users!trade_offers_receiver_id_fkey(id, displayname, avatar_url, role)
      `)
      .order('created_at', { ascending: false});

    if (status) {
      query = query.eq('status', status);
    }

    if (userId) {
      query = query.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
    }

    const { data: trades, error } = await query;

    if (error) {
      console.error('Error fetching trades:', error);
      return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
    }

    // Get item details
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
      trades: tradesWithItems,
      total: tradesWithItems.length
    });

  } catch (error) {
    console.error('Admin get trades error:', error);
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
  }
}
