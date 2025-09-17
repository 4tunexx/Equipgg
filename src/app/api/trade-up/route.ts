import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';
import { getDb, getOne, run, getAll } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const { itemIds } = await request.json();

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length !== 10) {
      return NextResponse.json({ error: 'Exactly 10 items are required for trade-up' }, { status: 400 });
    }

    const db = await getDb();
    
    // Get user's inventory items
    const items = await getAll(
      `SELECT * FROM user_inventory 
       WHERE user_id = ? AND id IN (${itemIds.map(() => '?').join(',')})`,
      [session.user_id, ...itemIds]
    );

    if (items.length !== 10) {
      return NextResponse.json({ error: 'Some items not found in inventory' }, { status: 404 });
    }

    // Check if all items have the same rarity
    const firstRarity = items[0].rarity;
    if (!items.every(item => item.rarity === firstRarity)) {
      return NextResponse.json({ error: 'All items must have the same rarity' }, { status: 400 });
    }

    // Define rarity tiers and outcomes
    const rarityTiers = {
      'Common': 0,
      'Uncommon': 1,
      'Rare': 2,
      'Epic': 3,
      'Legendary': 4,
      'Mythic': 5
    };

    const allRarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];
    const inputRarityIndex = rarityTiers[firstRarity as keyof typeof rarityTiers];

    // Calculate outcome based on probabilities
    const rand = Math.random();
    let outcomeRarityIndex;
    let reason = "";
    let success = false;

    // 70% same rarity, 25% one tier up, 5% two tiers up
    if (rand < 0.7) {
      outcomeRarityIndex = inputRarityIndex;
      reason = "A standard outcome, resulting in an item of the same rarity.";
    } else if (rand < 0.95) {
      outcomeRarityIndex = Math.min(inputRarityIndex + 1, allRarities.length - 1);
      reason = "A lucky trade! The contract yielded a higher-tier item.";
      success = true;
    } else {
      outcomeRarityIndex = Math.min(inputRarityIndex + 2, allRarities.length - 1);
      reason = "An exceptionally rare trade! The contract yielded an item two tiers higher!";
      success = true;
    }

    const outcomeRarity = allRarities[outcomeRarityIndex];

    // Get a random item of the outcome rarity from shop items
    const outcomeItems = await getAll(
      'SELECT * FROM shop_items WHERE rarity = ? AND stock_quantity > 0 ORDER BY RANDOM() LIMIT 1',
      [outcomeRarity]
    );

    let wonItem;
    if (outcomeItems.length > 0) {
      wonItem = outcomeItems[0];
    } else {
      // Fallback: create a generic item
      wonItem = {
        id: `tradeup-${Date.now()}`,
        name: `${outcomeRarity} Item`,
        image_url: 'https://picsum.photos/128/96?random=998',
        description: `A ${outcomeRarity.toLowerCase()} item obtained through trade-up`,
        category: 'Trade-up',
        rarity: outcomeRarity,
        price: Math.floor(Math.random() * 1000) + 100,
        stock_quantity: 1,
        item_type: 'skin'
      };
    }

    // Remove the input items from inventory
    await run(
      `DELETE FROM user_inventory WHERE user_id = ? AND id IN (${itemIds.map(() => '?').join(',')})`,
      [session.user_id, ...itemIds]
    );

    // Add the outcome item to inventory
    const newItemId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await run(
      `INSERT INTO user_inventory (id, user_id, item_id, item_name, item_type, rarity, image_url, value, acquired_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newItemId,
        session.user_id,
        wonItem.id,
        wonItem.name,
        wonItem.item_type || 'skin',
        wonItem.rarity,
        wonItem.image_url,
        wonItem.price || 0,
        new Date().toISOString()
      ]
    );

    // Record transaction
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await run(
      `INSERT INTO user_transactions (id, user_id, type, amount, currency, description, item_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        transactionId,
        session.user_id,
        'trade_up',
        0,
        'items',
        `Trade-up: ${items.length} ${firstRarity} items → ${wonItem.name}`,
        wonItem.id
      ]
    );

    // Log activity
    await run(
      `INSERT INTO user_activity_feed (id, user_id, username, activity_type, item_name, amount, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        session.user_id,
        'User',
        'trade_up',
        wonItem.name,
        1,
        new Date().toISOString()
      ]
    );

    return NextResponse.json({
      success: true,
      result: {
        newItem: {
          id: newItemId,
          name: wonItem.name,
          image: wonItem.image_url,
          rarity: wonItem.rarity,
          type: wonItem.item_type || 'skin',
          stat: {
            origin: 'Trade-up Contract',
            value: wonItem.price || 0
          }
        },
        success,
        reason
      }
    });

  } catch (error) {
    console.error('Trade-up error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
