import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../../lib/supabase";
import { getAuthSession } from "../../../../lib/auth-utils";
import { addXp } from "../../../../lib/xp-leveling-system";
import { trackMissionProgress } from "../../../../lib/mission-integration";
import { createNotification } from "../../../../lib/notification-utils";

// Rarity progression map
const RARITY_PROGRESSION: Record<string, string> = {
  'common': 'uncommon',
  'uncommon': 'rare',
  'rare': 'epic',
  'epic': 'legendary',
  'legendary': 'legendary' // Max rarity
};

// Rarity multipliers for value calculation
const RARITY_MULTIPLIERS: Record<string, number> = {
  'common': 1,
  'uncommon': 1.5,
  'rare': 2.5,
  'epic': 4,
  'legendary': 7
};

// POST /api/inventory/trade-up - Trade up 5 items for 1 higher rarity item
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { itemIds } = await request.json();

    // Validate input
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length !== 5) {
      return NextResponse.json(
        { error: 'Exactly 5 items are required for trade-up' },
        { status: 400 }
      );
    }

    // Count how many of each item ID we need
    const itemIdCounts = new Map<string, number>();
    itemIds.forEach(id => {
      itemIdCounts.set(id, (itemIdCounts.get(id) || 0) + 1);
    });

    console.log('🔍 Trade-up API - Item ID counts needed:', Array.from(itemIdCounts.entries()));

    // Fetch all items in one query
    const uniqueItemIds = Array.from(itemIdCounts.keys());
    const { data: allItems, error: fetchError } = await supabase
      .from('user_inventory')
      .select('*, items!fk_user_inventory_item(*)')
      .in('id', uniqueItemIds)
      .eq('user_id', session.user_id)
      .eq('equipped', false) // Filter out equipped items
      .neq('in_escrow', true); // Filter out items already in trade offers

    console.log('🔍 Trade-up API - Session user_id:', session.user_id);
    console.log('🔍 Trade-up API - Fetched items:', allItems);

    if (fetchError || !allItems) {
      console.error('❌ Error fetching items for trade-up:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch items. Make sure you own all 5 items.' },
        { status: 400 }
      );
    }

    // Check if user has enough quantity of each item
    for (const [itemId, neededCount] of itemIdCounts.entries()) {
      const item = allItems.find(i => i.id === itemId);
      if (!item) {
        return NextResponse.json(
          { error: `Item ${itemId} not found in your inventory.` },
          { status: 400 }
        );
      }
      const availableQuantity = item.quantity || 1;
      if (availableQuantity < neededCount) {
        return NextResponse.json(
          { error: `You only have ${availableQuantity} of ${item.item_name}, but need ${neededCount}.` },
          { status: 400 }
        );
      }
    }

    // Expand items array to include duplicates based on quantity
    const items: any[] = [];
    for (const [itemId, count] of itemIdCounts.entries()) {
      const item = allItems.find(i => i.id === itemId);
      if (item) {
        for (let i = 0; i < count; i++) {
          items.push(item);
        }
      }
    }

    console.log('🔍 Trade-up API - Expanded items array (5 items):', items.length);

    // ANTI-CHEAT: Verify all items belong to this user
    const allItemsBelongToUser = items.every(item => item.user_id === session.user_id);
    if (!allItemsBelongToUser) {
      console.error('⚠️ ANTI-CHEAT: User tried to trade-up items they do not own');
      return NextResponse.json(
        { error: 'Invalid item ownership detected.' },
        { status: 403 }
      );
    }

    // ANTI-CHEAT: For trade-up, we allow the same item multiple times (for stacked items)
    // But we need to verify the user has enough quantity of that item
    // This check happens after we verify all items belong to the user

    // Extract rarity from items (use items.rarity if available, otherwise use item.rarity)
    const rarities = items.map(item => {
      const rarity = item.items?.rarity || item.rarity;
      return rarity?.toLowerCase();
    });
    const uniqueRarities = [...new Set(rarities)];
    
    console.log('🔍 Trade-up API - Rarities:', rarities);
    console.log('🔍 Trade-up API - Unique rarities:', uniqueRarities);
    
    if (uniqueRarities.length !== 1) {
      return NextResponse.json(
        { error: 'All 5 items must be the same rarity for trade-up' },
        { status: 400 }
      );
    }

    const inputRarity = uniqueRarities[0];
    const outputRarity = RARITY_PROGRESSION[inputRarity];

    console.log('🔍 Trade-up API - Input rarity:', inputRarity, 'Output rarity:', outputRarity);

    if (!outputRarity) {
      return NextResponse.json(
        { error: 'Invalid rarity for trade-up' },
        { status: 400 }
      );
    }

    // Calculate average value of input items (use items.coin_price if available)
    const totalValue = items.reduce((sum, item) => {
      const value = item.items?.coin_price || item.value || 100;
      return sum + value;
    }, 0);
    const averageValue = Math.floor(totalValue / 5);
    const outputValue = Math.floor(averageValue * RARITY_MULTIPLIERS[outputRarity] / RARITY_MULTIPLIERS[inputRarity]);

    // Get random item of the output rarity from items table
    const { data: availableItems, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .ilike('rarity', `%${outputRarity}%`)
      .eq('is_active', true)
      .limit(50);

    if (itemsError || !availableItems || availableItems.length === 0) {
      console.error('Error fetching available items:', itemsError);
      return NextResponse.json(
        { error: `No ${outputRarity} items available for trade-up` },
        { status: 500 }
      );
    }

    // Pick a random item
    const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];

    // Delete the 5 input items (reduce quantity or delete completely)
    for (const [itemId, count] of itemIdCounts.entries()) {
      const item = allItems.find(i => i.id === itemId);
      if (item) {
        const currentQuantity = item.quantity || 1;
        const newQuantity = currentQuantity - count;
        
        if (newQuantity <= 0) {
          // Delete the entire stack
          const { error } = await supabase
            .from('user_inventory')
            .delete()
            .eq('id', itemId)
            .eq('user_id', session.user_id);
          
          if (error) {
            console.error('Error deleting item:', error);
            return NextResponse.json(
              { error: 'Failed to process trade-up' },
              { status: 500 }
            );
          }
        } else {
          // Update quantity
          const { error } = await supabase
            .from('user_inventory')
            .update({ quantity: newQuantity })
            .eq('id', itemId)
            .eq('user_id', session.user_id);
          
          if (error) {
            console.error('Error updating item quantity:', error);
            return NextResponse.json(
              { error: 'Failed to process trade-up' },
              { status: 500 }
            );
          }
        }
      }
    }

    console.log('✅ Trade-up items processed successfully');

    // Add the new item to inventory
    const { data: newItem, error: insertError } = await supabase
      .from('user_inventory')
      .insert({
        user_id: session.user_id,
        item_id: randomItem.id.toString(),
        item_name: randomItem.name,
        item_type: randomItem.type || 'weapon',
        rarity: randomItem.rarity,
        image_url: randomItem.image || randomItem.image_url,
        value: outputValue,
        equipped: false,
        obtained_from: 'trade_up',
        acquired_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding new item:', insertError);
      return NextResponse.json(
        { error: 'Failed to add new item to inventory' },
        { status: 500 }
      );
    }

    // Award XP for trade-up
    try {
      const xpAmount = 30; // Fixed XP for trade-up
      await addXp(session.user_id, xpAmount, 'trade_up');
      await trackMissionProgress(session.user_id, 'trade_up', 1);
      
      // Create notification
      await createNotification({
        userId: session.user_id,
        type: 'trade_up_success',
        title: '🔄 Trade-Up Complete!',
        message: `You received ${randomItem.name} (${outputRarity})!`,
        data: {
          itemId: newItem.id,
          itemName: randomItem.name,
          rarity: outputRarity
        }
      });
    } catch (xpError) {
      console.warn('Failed to award XP for trade-up:', xpError);
    }

    // Log trade-up contract
    try {
      await supabase
        .from('trade_up_contracts')
        .insert({
          user_id: session.user_id,
          input_items: items.map(i => ({ id: i.id, name: i.item_name, rarity: i.rarity })),
          output_item_id: randomItem.id,
          contract_cost: 0, // Free for now
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.warn('Failed to log trade-up contract:', logError);
    }

    return NextResponse.json({
      success: true,
      message: `Trade-up successful! You received ${randomItem.name}`,
      inputItems: items.map(i => ({
        id: i.id,
        name: i.items?.name || i.item_name,
        rarity: i.items?.rarity || i.rarity
      })),
      outputItem: {
        id: newItem.id,
        name: randomItem.name,
        type: randomItem.type,
        rarity: randomItem.rarity,
        image: randomItem.image || randomItem.image_url,
        value: outputValue,
        equipped: false,
        quantity: 1
      }
    });

  } catch (error) {
    console.error('Trade-up error:', error);
    return NextResponse.json(
      { error: 'Failed to process trade-up' },
      { status: 500 }
    );
  }
}
