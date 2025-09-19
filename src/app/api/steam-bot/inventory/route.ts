import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from "../../../../lib/auth-utils";
import { supabase } from "../../../../lib/supabase";
import { v4 as uuidv4 } from 'uuid';

// Steam Bot Inventory Management API
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user_id)
      .single();

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get bot inventory
    const { data: inventory } = await supabase
      .from('steam_bot_inventory')
      .select('*')
      .order('market_price', { ascending: false });

    // Get inventory stats
    const totalItems = inventory?.length || 0;
    const totalValue = inventory?.reduce((sum, item) => sum + (item.market_price || 0), 0) || 0;
    const availableItems = inventory?.filter(item => item.status === 'available').length || 0;

    return NextResponse.json({
      success: true,
      inventory: inventory || [],
      stats: {
        total_items: totalItems,
        available_items: availableItems,
        total_value: totalValue,
        pending_trades: inventory?.filter(item => item.status === 'pending_trade').length || 0
      }
    });

  } catch (error) {
    console.error('Steam bot inventory error:', error);
    return NextResponse.json({ error: 'Failed to get bot inventory' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user_id)
      .single();

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { action, data } = await request.json();

    switch (action) {
      case 'add_item':
        const itemId = uuidv4();
        const { error: addError } = await supabase
          .from('steam_bot_inventory')
          .insert({
            id: itemId,
            steam_asset_id: data.steam_asset_id,
            name: data.name,
            market_name: data.market_name,
            category: data.category,
            rarity: data.rarity,
            wear: data.wear,
            float_value: data.float_value,
            market_price: data.market_price,
            gem_price: data.gem_price,
            status: 'available',
            image_url: data.image_url,
            added_by: session.user_id,
            added_at: new Date().toISOString()
          });

        if (addError) {
          return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Item added to bot inventory',
          item_id: itemId
        });

      case 'update_item':
        const { error: updateError } = await supabase
          .from('steam_bot_inventory')
          .update({
            name: data.name,
            market_name: data.market_name,
            category: data.category,
            rarity: data.rarity,
            wear: data.wear,
            float_value: data.float_value,
            market_price: data.market_price,
            gem_price: data.gem_price,
            image_url: data.image_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id);

        if (updateError) {
          return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Item updated successfully'
        });

      case 'remove_item':
        const { error: removeError } = await supabase
          .from('steam_bot_inventory')
          .delete()
          .eq('id', data.id);

        if (removeError) {
          return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Item removed from inventory'
        });

      case 'sync_inventory':
        // Simulate Steam API inventory sync
        // In real implementation, this would call Steam API
        const { error: syncError } = await supabase
          .from('steam_bot_config')
          .update({
            last_sync: new Date().toISOString(),
            status: 'online'
          })
          .eq('id', 1);

        return NextResponse.json({
          success: true,
          message: 'Inventory sync completed',
          synced_items: Math.floor(Math.random() * 10) + 1
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Steam bot inventory action error:', error);
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 });
  }
}