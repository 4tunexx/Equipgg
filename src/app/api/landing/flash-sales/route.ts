import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-utils';
import { getDb, getAll, getOne, run } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    await getDb();
    
    const flashSales = await getAll(`
      SELECT * FROM flash_sales 
      WHERE is_active = 1 
      ORDER BY created_at DESC
    `);

    return NextResponse.json(flashSales);
  } catch (error) {
    console.error('Error fetching flash sales:', error);
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
    
    const { name, description, discount_percentage, start_date, end_date } = body;
    
    if (!name || !discount_percentage || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    
    run(`
      INSERT INTO flash_sales (id, name, description, discount_percentage, start_date, end_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, name, description, discount_percentage, start_date, end_date, now, now]);

    return NextResponse.json({ 
      success: true, 
      message: 'Flash sale created successfully',
      id 
    });

  } catch (error) {
    console.error('Error creating flash sale:', error);
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
    
    const { id, name, description, discount_percentage, start_date, end_date, is_active } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Flash sale ID is required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    
    run(`
      UPDATE flash_sales 
      SET name = ?, description = ?, discount_percentage = ?, start_date = ?, end_date = ?, is_active = ?, updated_at = ?
      WHERE id = ?
    `, [name, description, discount_percentage, start_date, end_date, is_active, now, id]);

    return NextResponse.json({ 
      success: true, 
      message: 'Flash sale updated successfully' 
    });

  } catch (error) {
    console.error('Error updating flash sale:', error);
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
        { error: 'Flash sale ID is required' },
        { status: 400 }
      );
    }

    run('DELETE FROM flash_sales WHERE id = ?', [id]);

    return NextResponse.json({ 
      success: true, 
      message: 'Flash sale deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting flash sale:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
