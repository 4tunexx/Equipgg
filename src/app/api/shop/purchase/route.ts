import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';
import { getDb, getOne, run } from '@/lib/db';
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

    const db = await getDb();
    
    // Get user info
    const user = await getOne<{id: string, coins: number}>('SELECT id, coins FROM users WHERE id = ?', [session.user_id]);

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
    const item = await getOne(
      'SELECT * FROM shop_items WHERE id = ? AND stock_quantity > 0',
      [itemId]
    );
    
    if (!item) {
      return NextResponse.json({ error: 'Item not found or out of stock' }, { status: 404 });
    }

    // Start transaction
    const newBalance = user.coins - price;
    
    // Update user balance
    await run('UPDATE users SET coins = ? WHERE id = ?', [newBalance, user.id]);
    
    // Add item to inventory (if it's not a perk)
    if (item.item_type !== 'perk') {
      const inventoryId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await run(`
        INSERT INTO user_inventory (id, user_id, item_id, item_name, item_type, rarity, image_url, value, acquired_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [inventoryId, user.id, itemId, itemName, item.item_type, item.rarity, item.image_url, price, new Date().toISOString()]);
      
      // Update stock quantity
      await run(
        'UPDATE shop_items SET stock_quantity = stock_quantity - 1 WHERE id = ?',
        [itemId]
      );
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
      
      await run(`
        INSERT INTO user_perks (id, user_id, perk_id, perk_name, perk_type, duration_hours, expires_at, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [perkId, user.id, itemId, itemName, item.item_type, durationHours, expiresAt, 1]);
      
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
    await run(`
      INSERT INTO user_transactions (id, user_id, type, amount, currency, description, item_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [transactionId, user.id, 'purchase', -price, 'coins', `Purchased ${itemName}`, itemId]);
    
    // Track mission progress
    await trackShopVisit(user.id);
    
    // Track collection achievements
    await trackCollectionAchievement(user.id, 'shop_purchase');
    
    // Persist all changes to database
    await db.export();
    
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