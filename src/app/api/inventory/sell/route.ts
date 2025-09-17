import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';
import { getDb, getOne, run } from '@/lib/db';

// POST /api/inventory/sell - Sell an item from inventory
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const body = await request.json();
    const { itemId, sellPrice } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Get user info
    const user = await getOne<{id: string, coins: number}>('SELECT id, coins FROM users WHERE id = ?', [session.user_id]);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the item in user's inventory
    const item = await getOne<{id: string, user_id: string, item_name: string, value: number}>(
      'SELECT id, user_id, item_name, value FROM user_inventory WHERE id = ? AND user_id = ?',
      [itemId, user.id]
    );
    
    if (!item) {
      return NextResponse.json(
        { error: 'Item not found in inventory' },
        { status: 404 }
      );
    }

    // Calculate sell price (typically 70-80% of item value)
    const itemValue = item.value || 100;
    const calculatedSellPrice = sellPrice || Math.floor(itemValue * 0.75);

    // Update user balance
    const newBalance = user.coins + calculatedSellPrice;
    await run('UPDATE users SET coins = ? WHERE id = ?', [newBalance, user.id]);

    // Remove item from inventory
    await run('DELETE FROM user_inventory WHERE id = ?', [itemId]);

    // Record transaction
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await run(`
      INSERT INTO user_transactions (id, user_id, type, amount, currency, description, item_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [transactionId, user.id, 'sale', calculatedSellPrice, 'coins', `Sold ${item.item_name}`, itemId]);

    // Persist changes to database
    await db.export();

    return NextResponse.json({
      success: true,
      message: `${item.item_name} sold for ${calculatedSellPrice.toLocaleString()} coins`,
      price: calculatedSellPrice,
      soldItem: {
        id: item.id,
        name: item.item_name,
        sellPrice: calculatedSellPrice,
        originalValue: itemValue
      },
      newBalance
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
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Find the item in user's inventory
    const item = inventoryData.find(i => i.id === itemId);
    if (!item) {
      return NextResponse.json(
        { error: 'Item not found in inventory' },
        { status: 404 }
      );
    }

    // Calculate sell price (typically 70-80% of item value)
    const itemValue = item.stat?.value || 100;
    const sellPrice = Math.floor(itemValue * 0.75);

    // Calculate market trends (mock data)
    const marketTrends = {
      demand: Math.random() > 0.5 ? 'high' : 'low',
      priceChange: (Math.random() - 0.5) * 0.2, // -10% to +10%
      averagePrice: itemValue,
      recommendedSellPrice: sellPrice
    };

    return NextResponse.json({
      success: true,
      item: {
        id: item.id,
        name: item.name,
        type: item.type,
        rarity: item.rarity,
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