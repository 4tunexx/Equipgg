import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../../lib/supabase";

// GET /api/trades/open - Get all open trades available for offers
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting /api/trades/open');
    const supabase = createServerSupabaseClient();
    
    // Simple auth check using cookie
    const cookieHeader = request.headers.get('cookie') || '';
    const cookieMatch = cookieHeader.match(/equipgg_session=([^;]+)/);
    
    let userId: string | null = null;
    
    if (cookieMatch) {
      try {
        // Double decode because Next.js encodes cookies
        let cookieValue = cookieMatch[1];
        // Decode once
        cookieValue = decodeURIComponent(cookieValue);
        // If still encoded, decode again
        if (cookieValue.startsWith('%')) {
          cookieValue = decodeURIComponent(cookieValue);
        }
        const sessionData = JSON.parse(cookieValue);
        if (sessionData.user_id && (!sessionData.expires_at || Date.now() < sessionData.expires_at)) {
          userId = sessionData.user_id;
        }
      } catch (e) {
        console.error('Failed to parse session cookie:', e);
      }
    }
    
    if (!userId) {
      console.log('❌ No session found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('✅ Session found, user:', userId);

    // Get all open trades (excluding user's own trades)
    const { data: trades, error } = await supabase
      .from('trade_offers')
      .select(`
        *,
        sender:users!trade_offers_sender_id_fkey(id, displayname, avatar_url)
      `)
      .eq('status', 'open')
      .neq('sender_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching open trades:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json({ 
        error: 'Failed to fetch trades', 
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ Found', trades?.length || 0, 'open trades');

    // Get item details for each trade
    const tradesWithItems = await Promise.all(trades.map(async (trade) => {
      const itemIds = trade.sender_items || [];
      let items: any[] = [];

      if (itemIds.length > 0) {
        const { data } = await supabase
          .from('user_inventory')
          .select('id, item_name, item_type, rarity, image_url, value')
          .in('id', itemIds);
        items = data || [];
        console.log(`📦 Trade ${trade.id} items:`, items);
      }

      return {
        ...trade,
        senderItemsDetails: items
      };
    }));

    console.log('📦 Returning trades with items:', tradesWithItems.length);

    return NextResponse.json({
      success: true,
      trades: tradesWithItems,
      total: tradesWithItems.length
    });

  } catch (error) {
    console.error('❌❌❌ Get open trades error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ 
      error: 'Failed to fetch trades',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
