import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';
import { getDb, getOne, run } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const { itemId, slot } = await request.json();

    if (!itemId || !slot) {
      return NextResponse.json({ error: 'Item ID and slot are required' }, { status: 400 });
    }

    const db = await getDb();
    
    // Check if item exists and belongs to user
    const item = await getOne<{id: string, user_id: string, item_name: string, item_type: string}>(
      'SELECT id, user_id, item_name, item_type FROM user_inventory WHERE id = ? AND user_id = ?',
      [itemId, session.user_id]
    );

    if (!item) {
      return NextResponse.json({ error: 'Item not found in inventory' }, { status: 404 });
    }

    // Check if slot is valid
    const validSlots = ['primary', 'secondary', 'knife', 'gloves', 'agent'];
    if (!validSlots.includes(slot)) {
      return NextResponse.json({ error: 'Invalid slot' }, { status: 400 });
    }

    // Check if item type matches slot
    const slotMapping = {
      'primary': ['Rifle', 'SMG', 'Heavy'],
      'secondary': ['Pistol'],
      'knife': ['Knife'],
      'gloves': ['Gloves'],
      'agent': ['Operator']
    };

    const allowedTypes = slotMapping[slot as keyof typeof slotMapping];
    if (!allowedTypes || !allowedTypes.includes(item.item_type)) {
      return NextResponse.json({ 
        error: `${item.item_type} items cannot be equipped to ${slot} slot` 
      }, { status: 400 });
    }

    // Remove any existing item in this slot
    await run('UPDATE user_inventory SET equipped = 0, slot_type = NULL WHERE user_id = ? AND slot_type = ?', [session.user_id, slot]);

    // Equip the new item
    await run('UPDATE user_inventory SET equipped = 1, slot_type = ? WHERE id = ? AND user_id = ?', [slot, itemId, session.user_id]);

    // Persist changes to database
    await db.export();

    return NextResponse.json({
      success: true,
      message: `${item.item_name} equipped to ${slot} slot`
    });

  } catch (error) {
    console.error('Equip item error:', error);
    return NextResponse.json({ error: 'Failed to equip item' }, { status: 500 });
  }
}