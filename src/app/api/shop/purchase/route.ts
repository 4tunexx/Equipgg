import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../../lib/supabase";
import { trackShopVisit } from "../../../../lib/mission-tracker";
import { trackCollectionAchievement } from "../../../../lib/achievement-tracker";
import { getAuthSession } from "../../../../lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get authenticated session
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user_id;

    const { itemId, itemName, price } = await request.json();

    if (!itemId || !itemName || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user info and current balance
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, displayname, coins, gems')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has enough coins
    if (price > user.coins) {
      return NextResponse.json({ 
        error: 'Insufficient coins',
        balance: user.coins,
        required: price
      }, { status: 400 });
    }

    // Get item details (handle both shop_item_id and direct item_id)
    const isDirectItem = itemId.startsWith('shop_');
    const actualItemId = isDirectItem ? itemId.replace('shop_', '') : itemId;
    
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('*')
      .eq('id', actualItemId)
      .single();
    
    if (itemError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Calculate new balance
    const newBalance = user.coins - price;
    
    // Update user balance
    const { error: updateError } = await supabase
      .from('users')
      .update({ coins: newBalance })
      .eq('id', user.id);
      
    if (updateError) {
      console.error('Failed to update user balance:', updateError);
      return NextResponse.json({ error: 'Failed to update user balance' }, { status: 500 });
    }
    
    // Add item to user inventory
    const inventoryId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { error: inventoryError } = await supabase
      .from('user_inventory')
      .insert({
        id: inventoryId,
        user_id: user.id,
        item_id: actualItemId,
        item_name: item.name,
        item_type: item.type || 'weapon',
        rarity: item.rarity || 'common',
        image_url: item.image || item.image_url || '/assets/placeholder.svg',
        value: price,
        obtained_from: 'shop_purchase',
        acquired_at: new Date().toISOString()
      });
    
    if (inventoryError) {
      console.error('Failed to add item to inventory:', inventoryError);
      // Rollback the balance update
      await supabase
        .from('users')
        .update({ coins: user.coins })
        .eq('id', user.id);
      return NextResponse.json({ error: 'Failed to add item to inventory' }, { status: 500 });
    }
    
    // Record transaction
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { error: transactionError } = await supabase
      .from('user_transactions')
      .insert({
        id: transactionId,
        user_id: user.id,
        type: 'purchase',
        amount: -price,
        currency: 'coins',
        description: `Purchased ${item.name}`,
        item_id: actualItemId,
        created_at: new Date().toISOString()
      });
    
    if (transactionError && transactionError.code !== 'PGRST116') {
      console.error('Failed to record transaction:', transactionError);
      // Don't fail the purchase for this
    }
    
    // Track mission progress (non-blocking)
    try {
      await trackShopVisit(user.id);
      await trackCollectionAchievement(user.id, 'shop_purchase');
    } catch (trackingError) {
      console.warn('Failed to track mission/achievement progress:', trackingError);
    }
    
    // Log activity to activity feed (non-blocking)
    try {
      await supabase
        .from('activity_feed')
        .insert({
          user_id: user.id,
          activity_type: 'purchase',
          description: `purchased ${item.name}`,
          item_name: item.name,
          amount: price,
          created_at: new Date().toISOString()
        });
    } catch (activityError) {
      console.warn('Failed to log activity:', activityError);
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${item.name}`,
      newBalance,
      purchasedItem: {
        id: inventoryId,
        name: item.name,
        type: item.type,
        rarity: item.rarity,
        price,
        image_url: item.image_url
      }
    });

  } catch (error) {
    console.error('Purchase error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}