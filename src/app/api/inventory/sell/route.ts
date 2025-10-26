import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../../lib/supabase";
import { trackMissionProgress, updateOwnershipMissions } from "../../../../lib/mission-integration";
import { trackItemSold } from "../../../../lib/activity-tracker";
import { cookies } from 'next/headers';

// POST /api/inventory/sell - Sell an item from inventory
export async function POST(request: NextRequest) {
  console.log('💸 Sell API called');
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('equipgg_session');
    
    if (!sessionCookie) {
      console.log('❌ No session cookie');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const session = JSON.parse(decodeURIComponent(sessionCookie.value));
    const userId = session.user_id;
    console.log('✅ Session found for user:', userId);
    
    const supabase = createServerSupabaseClient();

    const body = await request.json();
    const { itemId, sellPrice } = body;

    console.log('📦 Sell request:', { itemId, sellPrice });

    if (!itemId) {
      console.log('❌ No item ID provided');
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Get user info and inventory item in parallel
    const [userResponse, inventoryItemResponse] = await Promise.all([
      supabase
        .from('users')
        .select('id, coins')
        .eq('id', userId)
        .single(),
      supabase
        .from('user_inventory')
        .select('*, items!fk_user_inventory_item(*)')
        .eq('id', itemId)
        .eq('user_id', userId)
        .single()
    ]);

    if (userResponse.error || !userResponse.data) {
      console.error('Error fetching user:', userResponse.error);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (inventoryItemResponse.error || !inventoryItemResponse.data) {
      console.error('Error fetching inventory item:', inventoryItemResponse.error);
      return NextResponse.json(
        { error: 'Item not found in inventory' },
        { status: 404 }
      );
    }

    const user = userResponse.data;
    const inventoryItem = inventoryItemResponse.data;

    // Calculate sell price for ONE item (typically 75% of item value)
    const itemValue = inventoryItem.items.coin_price || 100;
    const calculatedSellPrice = sellPrice || Math.floor(itemValue * 0.75);
    
    // Get current quantity
    const currentQuantity = inventoryItem.quantity || 1;
    console.log(`💰 Selling 1 item from stack of ${currentQuantity}`);

    // If quantity > 1, decrease by 1. If quantity = 1, delete the row.
    if (currentQuantity > 1) {
      // Decrease quantity by 1
      const { error: updateError } = await supabase
        .from('user_inventory')
        .update({ 
          quantity: currentQuantity - 1,
          acquired_at: new Date().toISOString() // Update timestamp
        })
        .eq('id', itemId)
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error decreasing quantity:', updateError);
        return NextResponse.json(
          { error: 'Failed to update item quantity' },
          { status: 500 }
        );
      }
      
      console.log(`✅ Decreased quantity to ${currentQuantity - 1}`);
    } else {
      // Quantity is 1, delete the entire row
      const { error: deleteError } = await supabase
        .from('user_inventory')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error deleting item:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete item' },
          { status: 500 }
        );
      }
      
      console.log('✅ Deleted last item from inventory');
    }

    // Update user coins
    const { error: updateError } = await supabase
      .from('users')
      .update({ coins: user.coins + calculatedSellPrice })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating coins:', updateError);
      return NextResponse.json(
        { error: 'Failed to update balance' },
        { status: 500 }
      );
    }

    // Track mission progress for selling items
    try {
      await trackMissionProgress(userId, 'item_sold', 1);
      await trackMissionProgress(userId, 'earn_coins', calculatedSellPrice);
      await updateOwnershipMissions(userId);
      await trackItemSold(userId, inventoryItem.items.name, calculatedSellPrice);
      console.log('✅ Item sell mission and activity tracked for user:', userId);
    } catch (missionError) {
      console.warn('Failed to track sell mission:', missionError);
    }

    return NextResponse.json({
      success: true,
      message: `Sold 1x ${inventoryItem.items.name} for ${calculatedSellPrice.toLocaleString()} coins${currentQuantity > 1 ? ` (${currentQuantity - 1} remaining)` : ''}`,
      price: calculatedSellPrice,
      soldItem: {
        id: inventoryItem.id,
        name: inventoryItem.items.name,
        sellPrice: calculatedSellPrice,
        originalValue: itemValue,
        quantitySold: 1,
        remainingQuantity: currentQuantity > 1 ? currentQuantity - 1 : 0
      },
      newBalance: user.coins + calculatedSellPrice
    });

  } catch (error) {
    console.error('Sell item error:', error);
    return NextResponse.json(
      { error: 'Failed to sell item' },
      { status: 500 }
    );
  }
}

// GET /api/inventory/sell - Get sell price for an item
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('equipgg_session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const session = JSON.parse(decodeURIComponent(sessionCookie.value));
    const userId = session.user_id;
    const supabase = createServerSupabaseClient();

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Get inventory item with market data
    const { data: inventoryItem, error: itemError } = await supabase
      .from('user_inventory')
      .select(`
        *,
        items!fk_user_inventory_item(*)
      `)
      .eq('id', itemId)
      .eq('user_id', userId)
      .single();

    if (itemError || !inventoryItem) {
      console.error('Error fetching inventory item:', itemError);
      return NextResponse.json(
        { error: 'Item not found in inventory' },
        { status: 404 }
      );
    }

    // Calculate sell price (75% of item value)
    const itemValue = inventoryItem.items.coin_price || 100;
    const sellPrice = Math.floor(itemValue * 0.75);

    return NextResponse.json({
      success: true,
      item: {
        id: inventoryItem.id,
        name: inventoryItem.items.name,
        type: inventoryItem.items.type,
        rarity: inventoryItem.items.rarity,
        originalValue: itemValue
      },
      sellPrice
    });

  } catch (error) {
    console.error('Get sell price error:', error);
    return NextResponse.json(
      { error: 'Failed to get sell price' },
      { status: 500 }
    );
  }
}