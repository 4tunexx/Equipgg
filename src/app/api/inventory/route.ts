import { NextRequest, NextResponse } from 'next/server';
import { supabase } from "../../../lib/supabase";
import { createSupabaseQueries } from "../../../lib/supabase/queries";

const queries = createSupabaseQueries(supabase);

interface InventoryItem {
  id: string;
  item_id: string;
  user_id: string;
  equipped: boolean;
  acquired_at: string;
  item: {
    id: string;
    name: string;
    type: string;
    rarity: string;
    image_url: string;
    slot_type: string;
    value: number;
  };
}

// GET /api/inventory - Fetch user's inventory
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
    const filter = searchParams.get('filter');
    const equipped = searchParams.get('equipped');

    // Build query for user's inventory
    let query = supabase
      .from('user_inventory')
      .select('*, item:items(*)')
      .eq('user_id', session.user.id);

    // Apply filters
    if (filter && filter !== 'all') {
      query = query.eq('item.type', filter);
    }

    if (equipped === 'true') {
      query = query.eq('equipped', true);
    }

    // Order by acquisition date
    query = query.order('acquired_at', { ascending: false });

    // Execute query
    const { data: inventoryItems, error } = await query;

    if (error) {
      console.error('Error fetching inventory:', error);
      return NextResponse.json(
        { error: 'Failed to fetch inventory' },
        { status: 500 }
      );
    }

    // Transform data to match expected format
    const inventory = (inventoryItems as InventoryItem[]).map(record => ({
      id: record.id,
      name: record.item.name,
      type: record.item.type,
      rarity: record.item.rarity,
      image: record.item.image_url,
      equipped: record.equipped,
      slotType: record.item.slot_type,
      stat: {
        value: record.item.value
      }
    }));

    return NextResponse.json({
      success: true,
      inventory,
      total: inventory.length
    });

  } catch (error) {
    console.error('Inventory fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

// POST /api/inventory - Add item to inventory (from purchases, rewards, etc.)
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
    const { itemId, itemName, itemType, rarity, image, origin, value } = body;

    if (!itemId || !itemName) {
      return NextResponse.json(
        { error: 'Item ID and name are required' },
        { status: 400 }
      );
    }

    // First ensure the item exists in the items table
    const { data: existingItem, error: itemError } = await supabase
      .from('items')
      .upsert({
        id: itemId,
        name: itemName,
        type: itemType || 'Pistol',
        rarity: rarity || 'Common',
        image_url: image || 'https://picsum.photos/128/96?random=' + Math.floor(Math.random() * 1000),
        value: value || 100,
        slot_type: 'weapon'
      })
      .select()
      .single();

    if (itemError) {
      console.error('Error creating/updating item:', itemError);
      return NextResponse.json(
        { error: 'Failed to create item' },
        { status: 500 }
      );
    }

    // Add item to user's inventory
    const { data: inventoryItem, error: insertError } = await supabase
      .from('user_inventory')
      .insert({
        user_id: session.user.id,
        item_id: itemId,
        equipped: false,
        acquired_at: new Date().toISOString(),
        origin: origin || 'Purchase'
      })
      .select('*, item:items(*)')
      .single();

    if (insertError) {
      console.error('Error adding item to inventory:', insertError);
      return NextResponse.json(
        { error: 'Failed to add item to inventory' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${itemName} added to inventory`,
      item: inventoryItem
    });

  } catch (error) {
    console.error('Add item error:', error);
    return NextResponse.json(
      { error: 'Failed to add item to inventory' },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory - Remove item from inventory
export async function DELETE(request: NextRequest) {
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

    // First verify the item exists in user's inventory
    const { data: inventoryItem, error: findError } = await supabase
      .from('user_inventory')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('id', itemId)
      .single();

    if (findError || !inventoryItem) {
      console.error('Error finding inventory item:', findError);
      return NextResponse.json(
        { error: 'Item not found in inventory' },
        { status: 404 }
      );
    }

    // Remove the item from user's inventory
    const { error: deleteError } = await supabase
      .from('user_inventory')
      .delete()
      .eq('id', itemId)
      .eq('user_id', session.user.id);

    if (deleteError) {
      console.error('Error removing item from inventory:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove item' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Item removed from inventory',
      removedItemId: itemId
    });

  } catch (error) {
    console.error('Remove item error:', error);
    return NextResponse.json(
      { error: 'Failed to remove item from inventory' },
      { status: 500 }
    );
  }
}