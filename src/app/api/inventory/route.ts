import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../lib/supabase";
import { createSupabaseQueries } from "../../../lib/supabase/queries";
import { getAuthSession } from "../../../lib/auth-utils";

const supabase = createServerSupabaseClient();
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
    const supabase = createServerSupabaseClient();
    
    // Get authenticated session
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = session.user_id;

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');
    const equipped = searchParams.get('equipped');

    // Build query for user's inventory
    // Use explicit column selection instead of relying on foreign key relationships
    let query = supabase
      .from('user_inventory')
      .select(`
        id,
        item_id,
        user_id,
        equipped,
        acquired_at,
        item_name,
        item_type,
        rarity,
        image_url,
        value
      `)
      .eq('user_id', userId);

    // Apply filters
    if (filter && filter !== 'all') {
      query = query.eq('item_type', filter);
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

    // Helper function to generate image URLs (same as shop/admin pages)
    const getItemImageUrl = (itemName: string, category: string, existingImage?: string) => {
      // Only use existing image if it's NOT a placeholder
      if (existingImage && !existingImage.includes('placeholder')) return existingImage;
      
      const baseUrl = 'https://www.csgodatabase.com/images';
      const categoryLower = category?.toLowerCase() || '';
      const nameLower = itemName?.toLowerCase() || '';
      
      const knifeNames = ['karambit', 'bayonet', 'butterfly', 'falchion', 'flip', 'gut', 'huntsman', 
                          'bowie', 'shadow daggers', 'navaja', 'stiletto', 'ursus', 'talon', 
                          'classic knife', 'paracord', 'survival', 'nomad', 'skeleton', 'daggers'];
      
      const gloveNames = ['hand wraps', 'driver gloves', 'sport gloves', 'specialist gloves', 
                          'moto gloves', 'bloodhound gloves', 'hydra gloves', 'broken fang gloves'];
      
      let path = 'skins';
      
      if (categoryLower.includes('knife') || categoryLower === 'knives' || 
          knifeNames.some(knife => nameLower.includes(knife))) {
        path = 'knives';
      } else if (categoryLower.includes('glove') || categoryLower === 'gloves' || 
                 gloveNames.some(glove => nameLower.includes(glove))) {
        path = 'gloves';
      } else if (categoryLower.includes('agent') || categoryLower === 'operator') {
        path = 'agents';
      }
      
      const formattedName = itemName
        .replace(/\s*\|\s*/g, '_')
        .replace(/\s+/g, '_');
      
      return `${baseUrl}/${path}/webp/${formattedName}.webp`;
    };

    // Transform data to match expected format
    const inventory = (inventoryItems as any[]).map(record => {
      const imageUrl = getItemImageUrl(record.item_name, record.item_type, record.image_url);
      console.log(`📦 Item: ${record.item_name}, Type: ${record.item_type}, Generated Image: ${imageUrl}`);
      
      return {
        id: record.id,
        name: record.item_name,
        type: record.item_type,
        rarity: record.rarity,
        image: imageUrl,
        equipped: record.equipped,
        slotType: 'weapon',
        stat: {
          value: record.value || 100
        }
      };
    });

    console.log(`✅ Returning ${inventory.length} items from inventory API`);
    if (inventory.length > 0) {
      console.log('📸 First item image URL:', inventory[0].image);
    }

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
    const supabase = createServerSupabaseClient();
    
    // Get authenticated session
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = session.user_id;

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
        user_id: userId,
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
    const supabase = createServerSupabaseClient();
    
    // Get authenticated session
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = session.user_id;

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
      .eq('user_id', userId)
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
      .eq('user_id', userId);

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