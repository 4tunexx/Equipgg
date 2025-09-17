import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-utils';
import { getDb, getAll, getOne, run } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    await getDb();
    
    const featuredItems = await getAll(`
      SELECT * FROM featured_items 
      WHERE is_active = 1 
      ORDER BY sort_order ASC, created_at DESC
    `);

    return NextResponse.json(featuredItems);
  } catch (error) {
    console.error('Error fetching featured items:', error);
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await getOne('SELECT role FROM users WHERE id = ?', [session.user_id]);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await getDb();
    const body = await request.json();
    
    const { name, description, image_url, item_type, rarity, price, sort_order } = body;
    
    if (!name || !image_url) {
      return NextResponse.json(
        { error: 'Name and image URL are required' },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    
    run(`
      INSERT INTO featured_items (id, name, description, image_url, item_type, rarity, price, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, name, description, image_url, item_type, rarity, price, sort_order || 0, now, now]);

    return NextResponse.json({ 
      success: true, 
      message: 'Featured item created successfully',
      id 
    });

  } catch (error) {
    console.error('Error creating featured item:', error);
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await getOne('SELECT role FROM users WHERE id = ?', [session.user_id]);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await getDb();
    const body = await request.json();
    
    const { id, name, description, image_url, item_type, rarity, price, sort_order, is_active } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Featured item ID is required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    
    run(`
      UPDATE featured_items 
      SET name = ?, description = ?, image_url = ?, item_type = ?, rarity = ?, price = ?, sort_order = ?, is_active = ?, updated_at = ?
      WHERE id = ?
    `, [name, description, image_url, item_type, rarity, price, sort_order, is_active, now, id]);

    return NextResponse.json({ 
      success: true, 
      message: 'Featured item updated successfully' 
    });

  } catch (error) {
    console.error('Error updating featured item:', error);
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await getOne('SELECT role FROM users WHERE id = ?', [session.user_id]);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Featured item ID is required' },
        { status: 400 }
      );
    }

    run('DELETE FROM featured_items WHERE id = ?', [id]);

    return NextResponse.json({ 
      success: true, 
      message: 'Featured item deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting featured item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
