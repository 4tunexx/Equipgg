import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse, createForbiddenResponse } from "../../../../lib/auth-utils";
import { secureDb } from "../../../../lib/secure-db";
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

    // Get all items from database
    let items = await secureDb.findMany('user_inventory', {}, { orderBy: 'acquired_at' });
    items = (items || []).reverse();
    return NextResponse.json({
      success: true,
      items
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

    const itemId = uuidv4();
    const timestamp = new Date().toISOString();
    await secureDb.create('user_inventory', {
      id: itemId,
      user_id: 'admin-created',
      item_id: itemId,
      item_name: name,
      item_type: type,
      rarity,
      value: value || 0,
      image_url: image_url || 'https://picsum.photos/300/200',
      acquired_at: timestamp,
      description: description || ''
    });
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

    // Check if item exists
    const existingItem = await secureDb.findOne('user_inventory', { id });
    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    await secureDb.update('user_inventory', { id }, {
      item_name: name || existingItem.item_name,
      item_type: type || existingItem.item_type,
      rarity: rarity || existingItem.rarity,
      value: value !== undefined ? value : existingItem.value,
      image_url: image_url || existingItem.image_url,
      description: description || existingItem.description
    });
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

    // Check if item exists
    const existingItem = await secureDb.findOne('user_inventory', { id: itemId });
    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    await secureDb.delete('user_inventory', { id: itemId });
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
