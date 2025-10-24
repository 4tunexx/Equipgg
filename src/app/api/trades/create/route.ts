import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../../lib/supabase";
import { getAuthSession } from "../../../../lib/auth-utils";
import { createNotification } from "../../../../lib/notification-utils";

// POST /api/trades/create - Create an open trade listing
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { itemId, message } = await request.json();

    // Validate input
    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    // ANTI-CHEAT: Verify user owns the item and it's not equipped or already in a trade
    const { data: item, error: itemError } = await supabase
      .from('user_inventory')
      .select('id, equipped, in_escrow')
      .eq('id', itemId)
      .eq('user_id', session.user_id)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item not found in your inventory' }, { status: 400 });
    }

    if (item.equipped) {
      return NextResponse.json({ error: 'Cannot trade equipped items. Please unequip it first.' }, { status: 400 });
    }
    
    // ANTI-CHEAT: Check if item is already in escrow (another active trade)
    if (item.in_escrow) {
      return NextResponse.json({ error: 'This item is already in an active trade' }, { status: 400 });
    }
    
    // ANTI-CHEAT: Check if user already has this item in ANY active trade
    const { data: userTrades } = await supabase
      .from('trade_offers')
      .select('id, sender_items, status')
      .eq('sender_id', session.user_id)
      .in('status', ['open', 'pending']);
    
    if (userTrades) {
      for (const trade of userTrades) {
        const senderItems = trade.sender_items || [];
        if (senderItems.includes(itemId)) {
          return NextResponse.json({ 
            error: 'You already have an active trade with this item. Cancel the existing trade first.',
            existingTradeId: trade.id 
          }, { status: 400 });
        }
      }
    }
    
    // ANTI-CHEAT: Double check if item is in ANY active trade (from any user)
    const { data: allActiveTrades } = await supabase
      .from('trade_offers')
      .select('id, sender_items, receiver_items')
      .in('status', ['open', 'pending']);
    
    if (allActiveTrades) {
      for (const trade of allActiveTrades) {
        const allItems = [...(trade.sender_items || []), ...(trade.receiver_items || [])];
        if (allItems.includes(itemId)) {
          return NextResponse.json({ 
            error: 'This item is currently locked in another active trade'
          }, { status: 400 });
        }
      }
    }

    // Create open trade listing (no receiver yet)
    // Use server time from Supabase, not JavaScript Date
    console.log('🕐 Creating trade - will use Supabase NOW() for consistent time');
    
    const { data: trade, error: createError } = await supabase
      .from('trade_offers')
      .insert({
        id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sender_id: session.user_id,
        receiver_id: null, // Open trade - anyone can make offers
        sender_items: [itemId],
        receiver_items: [],
        sender_coins: 0,
        receiver_coins: 0,
        status: 'open'
        // Don't set expires_at or created_at - let database defaults handle it
        // Database will use NOW() for created_at and NOW() + interval for expires_at
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating trade:', createError);
      return NextResponse.json({ error: 'Failed to create trade' }, { status: 500 });
    }

    console.log('✅ Trade created successfully:', {
      id: trade.id,
      expires_at: trade.expires_at,
      created_at: trade.created_at,
      status: trade.status
    });

    return NextResponse.json({
      success: true,
      trade,
      message: 'Trade listing created! Other users can now make offers.'
    });

  } catch (error) {
    console.error('Create trade error:', error);
    return NextResponse.json({ error: 'Failed to create trade' }, { status: 500 });
  }
}
