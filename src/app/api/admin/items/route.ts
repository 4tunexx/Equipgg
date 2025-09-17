import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth-utils';
import { getDb, getAll, getOne, run } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return createUnauthorizedResponse();
    }

    if (session.role !== 'admin' && session.role !== 'moderator') {
      return createForbiddenResponse('You do not have permission to access admin functions.');
    }

    await getDb();

    // Get all items from database
    const items = await getAll(`
      SELECT * FROM user_inventory 
      ORDER BY acquired_at DESC
    `);

    return NextResponse.json({
      success: true,
      items: items || []
    });

  } catch (error) {
    console.error('Error fetching admin items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return createUnauthorizedResponse();
    }

    if (session.role !== 'admin') {
      return createForbiddenResponse('Only admins can create items.');
    }

    const { name, type, rarity, value, image_url, description } = await request.json();

    if (!name || !type || !rarity) {
      return NextResponse.json({ error: 'Name, type, and rarity are required' }, { status: 400 });
    }

    await getDb();

    const itemId = uuidv4();
    const timestamp = new Date().toISOString();

    run(`
      INSERT INTO user_inventory (id, user_id, item_id, item_name, item_type, rarity, value, image_url, acquired_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      itemId,
      'admin-created', // Special user_id for admin-created items
      itemId, // item_id same as id for admin-created items
      name,
      type,
      rarity,
      value || 0,
      image_url || 'https://picsum.photos/300/200',
      timestamp
    ]);

    return NextResponse.json({
      success: true,
      message: 'Item created successfully',
      item: {
        id: itemId,
        name,
        type,
        rarity,
        value: value || 0,
        image_url: image_url || 'https://picsum.photos/300/200',
        description: description || ''
      }
    });

  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return createUnauthorizedResponse();
    }

    if (session.role !== 'admin') {
      return createForbiddenResponse('Only admins can update items.');
    }

    const { id, name, type, rarity, value, image_url, description } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    await getDb();

    // Check if item exists
    const existingItem = await getOne('SELECT * FROM user_inventory WHERE id = ?', [id]);
    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Update item
    run(`
      UPDATE user_inventory 
      SET item_name = ?, item_type = ?, rarity = ?, value = ?, image_url = ?
      WHERE id = ?
    `, [
      name || existingItem.item_name,
      type || existingItem.item_type,
      rarity || existingItem.rarity,
      value !== undefined ? value : existingItem.value,
      image_url || existingItem.image_url,
      id
    ]);

    return NextResponse.json({
      success: true,
      message: 'Item updated successfully'
    });

  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return createUnauthorizedResponse();
    }

    if (session.role !== 'admin') {
      return createForbiddenResponse('Only admins can delete items.');
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    await getDb();

    // Check if item exists
    const existingItem = await getOne('SELECT * FROM user_inventory WHERE id = ?', [itemId]);
    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Delete item
    run('DELETE FROM user_inventory WHERE id = ?', [itemId]);

    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
