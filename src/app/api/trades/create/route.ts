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

    // Verify user owns the item and it's not equipped
    const { data: item, error: itemError } = await supabase
      .from('user_inventory')
      .select('id, equipped')
      .eq('id', itemId)
      .eq('user_id', session.user_id)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item not found in your inventory' }, { status: 400 });
    }

    if (item.equipped) {
      return NextResponse.json({ error: 'Cannot trade equipped items. Please unequip it first.' }, { status: 400 });
    }

    // Create open trade listing (no receiver yet)
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
        status: 'open', // New status for open trades
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating trade:', createError);
      return NextResponse.json({ error: 'Failed to create trade' }, { status: 500 });
    }

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
