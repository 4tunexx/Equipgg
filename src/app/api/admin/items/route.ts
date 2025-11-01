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

    // Get all items from the items table
    let rawItems = await secureDb.findMany('items', {}, { orderBy: 'created_at DESC' });

    // Normalize to UI shape expected by admin page
    const items = (rawItems || []).map((it: any) => ({
      id: it.id,
      name: it.name,
      type: it.type,
      rarity: it.rarity,
      value: it.coin_price || it.value || 0,
      image_url: it.image_url || it.image || '', // Use image_url from database (the actual column)
      created_at: it.created_at,
      description: it.description,
      category: it.category,
      weapon_type: it.weapon_type,
      is_equipable: it.is_equipable,
      for_crate: it.for_crate,
      featured: it.featured
    }));

    return NextResponse.json({ success: true, items });

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

    const { name, type, rarity, value, image_url, description, category, weapon_type, is_equipable, for_crate, featured } = await request.json();

    if (!name || !type || !rarity) {
      return NextResponse.json({ error: 'Name, type, and rarity are required' }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    const newItem = await secureDb.create('items', {
      name,
      type,
      category: category || type,
      weapon_type: weapon_type || null,
      rarity,
      coin_price: value || 0,
      gem_price: 0,
      image_url: image_url || '/assets/placeholder.svg',
      description: description || `${name} - ${type} weapon`,
      is_tradeable: true,
      is_sellable: true,
      is_equipable: is_equipable !== undefined ? is_equipable : true,
      for_crate: for_crate || false,
      sell_price: Math.floor((value || 0) * 0.7),
      is_active: true,
      featured: featured || false,
      created_at: timestamp,
      updated_at: timestamp
    });
    
    if (!newItem) {
      return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Item created successfully',
      item: {
        id: newItem.id,
        name,
        type,
        rarity,
        value: value || 0,
        image_url: image_url || '/assets/placeholder.svg',
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

    const { id, name, type, category, rarity, value, image_url, description, is_equipable, for_crate, featured } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    // Check if item exists in items table
    const existingItems = await secureDb.findMany('items', { id });
    if (!existingItems || existingItems.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    
    const existingItem = existingItems[0];
    
    // Update the item - use image_url (the actual database column)
    const imageValue = image_url !== undefined ? image_url : existingItem.image_url || existingItem.image;
    
    const updateData: any = {
      name: name || existingItem.name,
      type: type || existingItem.type,
      category: category || type || existingItem.category,
      rarity: rarity || existingItem.rarity,
      coin_price: value !== undefined ? value : existingItem.coin_price,
      description: description || existingItem.description,
      is_equipable: is_equipable !== undefined ? is_equipable : existingItem.is_equipable,
      for_crate: for_crate !== undefined ? for_crate : existingItem.for_crate,
      featured: featured !== undefined ? featured : existingItem.featured,
      updated_at: new Date().toISOString()
    };
    
    // Update image_url (the actual database column name)
    if (imageValue !== undefined && imageValue !== null) {
      updateData.image_url = imageValue.trim() !== '' ? imageValue : null;
    }
    
    await secureDb.update('items', { id }, updateData);
    
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
    const existingItems = await secureDb.findMany('items', { id: itemId });
    if (!existingItems || existingItems.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    
    await secureDb.delete('items', { id: itemId });
    
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
