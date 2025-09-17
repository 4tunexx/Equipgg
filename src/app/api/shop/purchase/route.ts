import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';
import { supabase } from '@/lib/supabase';
// Removed mock data import - now using database queries
import { trackShopVisit } from '@/lib/mission-tracker';
import { trackCollectionAchievement } from '@/lib/achievement-tracker';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const { itemId, itemName, price } = await request.json();

    if (!itemId || !itemName || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, coins')
      .eq('id', session.user_id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has enough coins
    if (price > user.coins) {
      return NextResponse.json({ 
        error: 'Insufficient coins',
        balance: user.coins 
      }, { status: 400 });
    }

    // Find item details in database
    const { data: item, error: itemError } = await supabase
      .from('shop_items')
      .select('*')
      .eq('id', itemId)
      .gt('stock_quantity', 0)
      .single();
    
    if (!item) {
      return NextResponse.json({ error: 'Item not found or out of stock' }, { status: 404 });
    }

    // Start transaction
    const newBalance = user.coins - price;
    
    // Update user balance
    const { error: updateError } = await supabase
      .from('users')
      .update({ coins: newBalance })
      .eq('id', user.id);
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update user balance' }, { status: 500 });
    }
    
    // Add item to inventory (if it's not a perk)
    if (item.item_type !== 'perk') {
      const inventoryId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await supabase.from('user_inventory').insert({
        id: inventoryId,
        user_id: user.id,
        item_id: itemId,
        item_name: itemName,
        item_type: item.item_type,
        rarity: item.rarity,
        image_url: item.image_url,
        value: price,
        acquired_at: new Date().toISOString()
      });
      // Update stock quantity
      await supabase.from('shop_items')
        .update({ stock_quantity: item.stock_quantity - 1 })
        .eq('id', itemId);
    } else {
      // Apply perk to user account
      const perkId = `perk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Calculate duration and expiration for time-based perks
      let durationHours = null;
      let expiresAt = null;
      
      if (itemName.includes('3 Hours')) {
        durationHours = 3;
        expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
      } else if (itemName.includes('24 Hours')) {
        durationHours = 24;
        expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      } else if (itemName.includes('7 Days')) {
        durationHours = 168; // 7 days
        expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (itemName.includes('14 Days')) {
        durationHours = 336; // 14 days
        expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      } else if (itemName.includes('30 Days')) {
        durationHours = 720; // 30 days
        expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (itemName.includes('Permanently') || itemName.includes('+1 Inventory Slot') || itemName.includes('+5 Inventory Slots')) {
        // Permanent perks
        durationHours = null;
        expiresAt = null;
      }
      
      await supabase.from('user_perks').insert({
        id: perkId,
        user_id: user.id,
        perk_id: itemId,
        perk_name: itemName,
        perk_type: item.item_type,
        duration_hours: durationHours,
        expires_at: expiresAt,
        is_active: true
      });
      
      // Apply immediate effects for certain perks
      if (itemName.includes('+1 Inventory Slot')) {
        // This would need to be handled in the inventory system
        // For now, we'll just record the perk
      } else if (itemName.includes('+5 Inventory Slots')) {
        // This would need to be handled in the inventory system
        // For now, we'll just record the perk
      }
    }
    
    // Record transaction
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await supabase.from('user_transactions').insert({
      id: transactionId,
      user_id: user.id,
      type: 'purchase',
      amount: -price,
      currency: 'coins',
      description: `Purchased ${itemName}`,
      item_id: itemId
    });
    
    // Track mission progress
    await trackShopVisit(user.id);
    
    // Track collection achievements
    await trackCollectionAchievement(user.id, 'shop_purchase');
    
  // All changes persisted via Supabase
    
    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${itemName}`,
      newBalance,
      purchasedItem: {
        id: itemId,
        name: itemName,
        price
      }
    });

  } catch (error) {
    console.error('Shop purchase error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}