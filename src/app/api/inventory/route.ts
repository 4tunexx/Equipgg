import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';
import { getDb, getOne, run, getAll } from '@/lib/db';
import { inventoryData } from '@/lib/mock-data';

// GET /api/inventory - Fetch user's inventory
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');
    const equipped = searchParams.get('equipped');

    const db = await getDb();
    
    // Get user ID
    const userId = session.user_id;

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build query based on filters
    let query = 'SELECT * FROM user_inventory WHERE user_id = ?';
    const params = [userId];

    if (filter && filter !== 'all') {
      query += ' AND item_type = ?';
      params.push(filter);
    }

    if (equipped === 'true') {
      query += ' AND equipped = 1';
    }

    query += ' ORDER BY acquired_at DESC';

    const inventoryItems = await getAll<{
      id: string,
      item_name: string,
      item_type: string,
      rarity: string,
      image_url: string,
      equipped: number,
      slot_type: string,
      value: number
    }>(query, params);
    
    const inventory = inventoryItems.map(item => ({
      id: item.id,
      name: item.item_name,
      type: item.item_type,
      rarity: item.rarity,
      image: item.image_url,
      equipped: Boolean(item.equipped),
      slotType: item.slot_type,
      stat: {
        value: item.value
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
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const body = await request.json();
    const { itemId, itemName, itemType, rarity, image, origin, value } = body;

    if (!itemId || !itemName) {
      return NextResponse.json(
        { error: 'Item ID and name are required' },
        { status: 400 }
      );
    }

    // Add item to database
    const db = await getDb();
    
    await run(`
      INSERT INTO user_inventory (
        id, user_id, item_id, item_name, item_type, rarity, 
        image_url, value, equipped, acquired_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      itemId,
      session.user_id,
      itemId,
      itemName,
      itemType || 'Pistol',
      rarity || 'Common',
      image || 'https://picsum.photos/128/96?random=' + Math.floor(Math.random() * 1000),
      value || 100,
      0,
      new Date().toISOString()
    ]);

    // Persist changes to database
    await db.export();

    const newItem = {
      id: itemId,
      name: itemName,
      type: itemType || 'Pistol',
      rarity: rarity || 'Common',
      image: image || 'https://picsum.photos/128/96?random=' + Math.floor(Math.random() * 1000),
      dataAiHint: itemName.toLowerCase(),
      stat: {
        origin: origin || 'Purchase',
        value: value || 100
      }
    };

    return NextResponse.json({
      success: true,
      message: `${itemName} added to inventory`,
      item: newItem
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

    // Mock item removal - in real app, remove from database
    const removedItem = inventoryData.find(item => item.id === itemId);
    
    if (!removedItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${removedItem.name} removed from inventory`,
      removedItem
    });

  } catch (error) {
    console.error('Remove item error:', error);
    return NextResponse.json(
      { error: 'Failed to remove item from inventory' },
      { status: 500 }
    );
  }
}