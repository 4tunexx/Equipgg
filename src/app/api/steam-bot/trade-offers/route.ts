import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from "../../../../lib/auth-utils";
import { supabase } from "../../../../lib/supabase";
import { v4 as uuidv4 } from 'uuid';

// Steam Bot Trade Offers API
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const isAdmin = url.searchParams.get('admin') === 'true';

    if (isAdmin) {
      // Check if user is admin
      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user_id)
        .single();

      if (!user || user.role !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }

      // Get all trade offers for admin
      const { data: tradeOffers } = await supabase
        .from('steam_trade_offers')
        .select(`
          *,
          users!steam_trade_offers_user_id_fkey(username, email),
          steam_bot_inventory!steam_trade_offers_item_id_fkey(name, market_name, gem_price)
        `)
        .order('created_at', { ascending: false });

      return NextResponse.json({
        success: true,
        trade_offers: tradeOffers || []
      });
    } else {
      // Get user's trade offers
      const { data: tradeOffers } = await supabase
        .from('steam_trade_offers')
        .select(`
          *,
          steam_bot_inventory!steam_trade_offers_item_id_fkey(name, market_name, gem_price, image_url)
        `)
        .eq('user_id', session.user_id)
        .order('created_at', { ascending: false });

      return NextResponse.json({
        success: true,
        trade_offers: tradeOffers || []
      });
    }

  } catch (error) {
    console.error('Trade offers get error:', error);
    return NextResponse.json({ error: 'Failed to get trade offers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, data } = await request.json();

    switch (action) {
      case 'create_trade_offer':
        // This is called when user buys a skin
        const tradeOfferId = uuidv4();

        // Check if item is available
        const { data: item } = await supabase
          .from('steam_bot_inventory')
          .select('*')
          .eq('id', data.item_id)
          .eq('status', 'available')
          .single();

        if (!item) {
          return NextResponse.json({ error: 'Item not available' }, { status: 400 });
        }

        // Create trade offer
        const { error: createError } = await supabase
          .from('steam_trade_offers')
          .insert({
            id: tradeOfferId,
            user_id: session.user_id,
            item_id: data.item_id,
            user_steam_id: data.user_steam_id,
            user_trade_url: data.user_trade_url,
            gems_paid: data.gems_paid,
            status: 'pending',
            steam_offer_id: null, // Will be set when actual trade offer is created
            created_at: new Date().toISOString()
          });

        if (createError) {
          return NextResponse.json({ error: 'Failed to create trade offer' }, { status: 500 });
        }

        // Mark item as pending trade
        await supabase
          .from('steam_bot_inventory')
          .update({ status: 'pending_trade' })
          .eq('id', data.item_id);

        // In real implementation, this would call Steam API to create actual trade offer
        // For now, simulate it
        setTimeout(async () => {
          const steamOfferId = `steam_${Date.now()}`;
          await supabase
            .from('steam_trade_offers')
            .update({
              steam_offer_id: steamOfferId,
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('id', tradeOfferId);
        }, 2000);

        return NextResponse.json({
          success: true,
          message: 'Trade offer created successfully',
          trade_offer_id: tradeOfferId,
          estimated_delivery: '5-10 minutes'
        });

      case 'cancel_trade_offer':
        // Check if user is admin or owns the trade offer
        const { data: tradeOffer } = await supabase
          .from('steam_trade_offers')
          .select('user_id, item_id, status')
          .eq('id', data.trade_offer_id)
          .single();

        if (!tradeOffer) {
          return NextResponse.json({ error: 'Trade offer not found' }, { status: 404 });
        }

        const { data: user } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user_id)
          .single();

        const isAdmin = user?.role === 'admin';
        const isOwner = tradeOffer.user_id === session.user_id;

        if (!isAdmin && !isOwner) {
          return NextResponse.json({ error: 'Not authorized to cancel this trade offer' }, { status: 403 });
        }

        if (tradeOffer.status === 'completed') {
          return NextResponse.json({ error: 'Cannot cancel completed trade offer' }, { status: 400 });
        }

        // Cancel trade offer
        const { error: cancelError } = await supabase
          .from('steam_trade_offers')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
          })
          .eq('id', data.trade_offer_id);

        if (cancelError) {
          return NextResponse.json({ error: 'Failed to cancel trade offer' }, { status: 500 });
        }

        // Mark item as available again
        await supabase
          .from('steam_bot_inventory')
          .update({ status: 'available' })
          .eq('id', tradeOffer.item_id);

        return NextResponse.json({
          success: true,
          message: 'Trade offer cancelled successfully'
        });

      case 'mark_completed':
        // Admin only - mark trade offer as completed
        const { data: adminUser } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user_id)
          .single();

        if (!adminUser || adminUser.role !== 'admin') {
          return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { error: completeError } = await supabase
          .from('steam_trade_offers')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', data.trade_offer_id);

        if (completeError) {
          return NextResponse.json({ error: 'Failed to mark trade offer as completed' }, { status: 500 });
        }

        // Remove item from bot inventory (it's been traded)
        await supabase
          .from('steam_bot_inventory')
          .update({ status: 'traded' })
          .eq('id', data.item_id);

        return NextResponse.json({
          success: true,
          message: 'Trade offer marked as completed'
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Trade offer action error:', error);
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 });
  }
}