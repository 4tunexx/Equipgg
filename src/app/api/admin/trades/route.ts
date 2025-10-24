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

// DELETE /api/admin/trades?tradeId=xxx - Delete a trade (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify admin/moderator
    const { data: user } = await supabase
      .from('users')
      .select('role, displayname')
      .eq('id', session.user_id)
      .single();

    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tradeId = searchParams.get('tradeId');
    const reason = searchParams.get('reason') || 'Removed by moderator';

    if (!tradeId) {
      return NextResponse.json({ error: 'Trade ID required' }, { status: 400 });
    }

    // Get trade details first
    const { data: trade } = await supabase
      .from('trade_offers')
      .select('*, sender:users!trade_offers_sender_id_fkey(displayname), receiver:users!trade_offers_receiver_id_fkey(displayname)')
      .eq('id', tradeId)
      .single();

    if (!trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    // Log admin action
    await supabase
      .from('admin_logs')
      .insert({
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        admin_id: session.user_id,
        action: 'delete_trade',
        details: reason,
        target_id: tradeId,
        created_at: new Date().toISOString()
      });

    // Delete the trade
    const { error: deleteError } = await supabase
      .from('trade_offers')
      .delete()
      .eq('id', tradeId);

    if (deleteError) {
      console.error('Error deleting trade:', deleteError);
      return NextResponse.json({ error: 'Failed to delete trade' }, { status: 500 });
    }

    // Notify affected users
    const { createNotification } = await import('../../../../lib/notification-utils');
    
    if (trade.sender_id) {
      await createNotification({
        userId: trade.sender_id,
        type: 'trade_cancelled',
        title: '⚠️ Trade Removed',
        message: `Your trade was removed by ${user.displayname}: ${reason}`,
        data: { tradeId }
      });
    }

    if (trade.receiver_id) {
      await createNotification({
        userId: trade.receiver_id,
        type: 'trade_cancelled',
        title: '⚠️ Trade Removed',
        message: `A trade was removed by ${user.displayname}: ${reason}`,
        data: { tradeId }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Trade deleted successfully'
    });

  } catch (error) {
    console.error('Admin delete trade error:', error);
    return NextResponse.json({ error: 'Failed to delete trade' }, { status: 500 });
  }
}
