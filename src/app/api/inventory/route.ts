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

    // Build query for user's inventory with item details joined
    let query = supabase
      .from('user_inventory')
      .select(`
        id,
        item_id,
        user_id,
        equipped,
        acquired_at,
        quantity,
        items!fk_user_inventory_item(
          id,
          name,
          type,
          category,
          rarity,
          image,
          image_url,
          coin_price,
          gem_price
        )
      `)
      .eq('user_id', userId);

    if (equipped === 'true') {
      query = query.eq('equipped', true);
    }

    // Order by acquisition date
    query = query.order('acquired_at', { ascending: false });

    // Execute query
    const { data: inventoryItems, error } = await query;

    if (error) {
      console.error('❌ Error fetching inventory:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: 'Failed to fetch inventory', details: error.message },
        { status: 500 }
      );
    }
    
    if (!inventoryItems) {
      return NextResponse.json({
        success: true,
        inventory: [],
        total: 0
      });
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
    const inventory = (inventoryItems as any[])
      .filter(record => record.items) // Only include items with valid item data
      .map(record => {
        const item = record.items;
        // PRIORITIZE database image_url - only use generated URL if database image is empty
        const dbImage = item.image_url || item.image;
        const imageUrl = dbImage && dbImage.trim() !== '' && !dbImage.includes('placeholder') 
          ? dbImage 
          : getItemImageUrl(item.name, item.type || item.category);
        console.log(`📦 Item: ${item.name}, Type: ${item.type}, Generated Image: ${imageUrl}`);
        
        return {
          id: record.id,
          name: item.name,
          type: item.type || item.category || 'Pistol',
          rarity: item.rarity || 'Common',
          image: imageUrl,
          equipped: record.equipped || false,
          quantity: record.quantity || 1,
          slotType: record.slot_type || 'weapon',
          price: item.coin_price || 100, // Real shop price
          stat: {
            value: item.coin_price || 100 // Real shop price
          }
        };
      });

    console.log(`✅ Returning ${inventory.length} items from inventory API`);
    if (inventory.length > 0) {
      console.log('📸 First item image URL:', inventory[0].image);
    }

    // Calculate inventory statistics
    const totalValue = inventory.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
    const rarityBreakdown = inventory.reduce((acc, item) => {
      const rarity = (item.rarity || 'Common').toLowerCase();
      const quantity = item.quantity || 1;
      acc[rarity] = (acc[rarity] || 0) + quantity;
      return acc;
    }, {} as Record<string, number>);

    // Calculate total item count including stacked items
    const itemCount = inventory.reduce((sum, item) => sum + (item.quantity || 1), 0);

    // Debug logging
    console.log('📊 Inventory Stats:');
    console.log(`  Total items (rows): ${inventory.length}`);
    console.log(`  Total items (with quantities): ${itemCount}`);
    console.log(`  Total value: ${totalValue}`);
    console.log(`  Rarity breakdown:`, JSON.stringify(rarityBreakdown));

    return NextResponse.json({
      success: true,
      inventory,
      total: inventory.length,
      stats: {
        totalValue,
        itemCount,
        rarityBreakdown
      }
    });

  } catch (error) {
    console.error('❌ Inventory fetch error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to fetch inventory', details: error instanceof Error ? error.message : 'Unknown error' },
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
      .select('*, items!fk_user_inventory_item(*)')
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