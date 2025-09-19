import { NextRequest, NextResponse } from 'next/server';
import { supabase } from "../../../../lib/supabase";

// POST /api/inventory/sell - Sell an item from inventory
export async function POST(request: NextRequest) {
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { itemId, sellPrice } = body;

    if (!itemId) {
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
        .eq('id', session.user.id)
        .single(),
      supabase
        .from('user_inventory')
        .select('*, item:items(*)')
        .eq('id', itemId)
        .eq('user_id', session.user.id)
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

    // Calculate sell price (typically 70-80% of item value)
    const itemValue = inventoryItem.item.value || 100;
    const calculatedSellPrice = sellPrice || Math.floor(itemValue * 0.75);

    // Start a transaction
    const { data: transaction, error: transactionError } = await supabase.rpc('sell_inventory_item', {
      p_user_id: session.user.id,
      p_item_id: itemId,
      p_sell_price: calculatedSellPrice,
      p_description: `Sold ${inventoryItem.item.name}`
    });

    if (transactionError) {
      console.error('Error during sell transaction:', transactionError);
      return NextResponse.json(
        { error: 'Failed to complete sale' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${inventoryItem.item.name} sold for ${calculatedSellPrice.toLocaleString()} coins`,
      price: calculatedSellPrice,
      soldItem: {
        id: inventoryItem.id,
        name: inventoryItem.item.name,
        sellPrice: calculatedSellPrice,
        originalValue: itemValue
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
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

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
        item:items(*),
        market:item_market_data(
          demand,
          price_change,
          average_price
        )
      `)
      .eq('id', itemId)
      .eq('user_id', session.user.id)
      .single();

    if (itemError || !inventoryItem) {
      console.error('Error fetching inventory item:', itemError);
      return NextResponse.json(
        { error: 'Item not found in inventory' },
        { status: 404 }
      );
    }

    // Calculate sell price (75% of item value)
    const itemValue = inventoryItem.item.value || 100;
    const sellPrice = Math.floor(itemValue * 0.75);

    // Get market data if available, otherwise use default values
    const marketTrends = {
      demand: inventoryItem.market?.demand || 'normal',
      priceChange: inventoryItem.market?.price_change || 0,
      averagePrice: inventoryItem.market?.average_price || itemValue,
      recommendedSellPrice: sellPrice
    };

    return NextResponse.json({
      success: true,
      item: {
        id: inventoryItem.id,
        name: inventoryItem.item.name,
        type: inventoryItem.item.type,
        rarity: inventoryItem.item.rarity,
        originalValue: itemValue
      },
      sellPrice,
      marketTrends
    });

  } catch (error) {
    console.error('Get sell price error:', error);
    return NextResponse.json(
      { error: 'Failed to get sell price' },
      { status: 500 }
    );
  }
}