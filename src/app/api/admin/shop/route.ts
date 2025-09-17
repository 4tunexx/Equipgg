import { NextRequest, NextResponse } from 'next/server';
import { getDb, getOne, getAll, run } from '@/lib/db';
import { getAuthSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth-utils';

// GET /api/admin/shop - Get all shop items for admin management
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }
    
    // Check if user is admin
    if (session.role !== 'admin') {
      return createForbiddenResponse('Admin access required');
    }

    // Get all shop items
    const shopItems = await getAll(`
      SELECT * FROM shop_items 
      ORDER BY created_at DESC
    `, []);

    // Get categories
    const categories = await getAll('SELECT DISTINCT category FROM shop_items', []);

    return NextResponse.json({ shopItems, categories });
  } catch (error) {
    console.error('Error fetching shop items:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/shop - Create new shop item
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }
    
    // Check if user is admin
    if (session.role !== 'admin') {
      return createForbiddenResponse('Admin access required');
    }

    const {
      name,
      image_url,
      description,
      category,
      rarity,
      price,
      stock_quantity,
      item_type = 'weapon'
    } = await request.json();

    if (!name || !category || !rarity || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create shop item
    const result = await run(`
      INSERT INTO shop_items (
        name, image_url, description, category, rarity, 
        price, stock_quantity, item_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, image_url, description, category, rarity,
      price, stock_quantity || 0, item_type
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'Shop item created successfully',
      itemId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error creating shop item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/shop - Update shop item
export async function PUT(request: NextRequest) {
  try {
    // Get session from cookies
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cookies = parse(cookieHeader);
    const sessionToken = cookies['equipgg_session'];
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    
    // Get session and user info
    const session = await getOne(
      'SELECT s.*, u.email, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?',
      [sessionToken]
    );
    
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    // Check if user is admin
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { itemId, updates } = await request.json();
    
    if (!itemId || !updates) {
      return NextResponse.json({ error: 'Missing itemId or updates' }, { status: 400 });
    }

    // Build dynamic update query
    const allowedFields = [
      'name', 'image_url', 'description', 'category', 'rarity', 
      'price', 'stock_quantity', 'item_type'
    ];
    const updateFields = [];
    const updateValues = [];
    
    for (const [field, value] of Object.entries(updates)) {
      if (allowedFields.includes(field)) {
        updateFields.push(`${field} = ?`);
        updateValues.push(value);
      }
    }
    
    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }
    
    updateValues.push(itemId);
    
    const updateQuery = `UPDATE shop_items SET ${updateFields.join(', ')} WHERE id = ?`;
    
    await run(updateQuery, updateValues);

    return NextResponse.json({ success: true, message: 'Shop item updated successfully' });
  } catch (error) {
    console.error('Error updating shop item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/shop - Delete shop item
export async function DELETE(request: NextRequest) {
  try {
    // Get session from cookies
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cookies = parse(cookieHeader);
    const sessionToken = cookies['equipgg_session'];
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    
    // Get session and user info
    const session = await getOne(
      'SELECT s.*, u.email, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?',
      [sessionToken]
    );
    
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    // Check if user is admin
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { itemId } = await request.json();
    
    if (!itemId) {
      return NextResponse.json({ error: 'Missing itemId' }, { status: 400 });
    }

    // Delete shop item
    await run('DELETE FROM shop_items WHERE id = ?', [itemId]);

    return NextResponse.json({ success: true, message: 'Shop item deleted successfully' });
  } catch (error) {
    console.error('Error deleting shop item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
