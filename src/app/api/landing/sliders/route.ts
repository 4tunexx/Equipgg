import { NextRequest, NextResponse } from 'next/server';
import { getDb, getAll, run } from '@/lib/db';
import { getAuthSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth-utils';

// GET /api/landing/sliders - Get all landing sliders
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }
    
    if (session.role !== 'admin') {
      return createForbiddenResponse('Admin access required');
    }

    const sliders = await getAll(`
      SELECT * FROM landing_sliders 
      ORDER BY position ASC
    `, []);

    // Parse the images JSON string back to array for each slider
    const parsedSliders = sliders.map(slider => ({
      ...slider,
      images: typeof slider.images === 'string' ? JSON.parse(slider.images) : slider.images
    }));

    return NextResponse.json(parsedSliders);
  } catch (error) {
    console.error('Error fetching landing sliders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/landing/sliders - Create a new landing slider
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }
    
    if (session.role !== 'admin') {
      return createForbiddenResponse('Admin access required');
    }

    const { name, images, auto_play, interval, position, is_visible } = await request.json();
    
    const sliderId = `slider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await run(`
      INSERT INTO landing_sliders (id, name, images, auto_play, interval, position, is_visible, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      sliderId,
      name,
      JSON.stringify(images || []),
      auto_play ? 1 : 0,
      interval || 5000,
      position,
      is_visible ? 1 : 0,
      new Date().toISOString()
    ]);

    const db = await getDb();
    await db.export();

    return NextResponse.json({ success: true, id: sliderId });
  } catch (error) {
    console.error('Error creating landing slider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/landing/sliders - Update a landing slider
export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }
    
    if (session.role !== 'admin') {
      return createForbiddenResponse('Admin access required');
    }

    const { id, name, images, auto_play, interval, position, is_visible } = await request.json();
    
    await run(`
      UPDATE landing_sliders 
      SET name = ?, images = ?, auto_play = ?, interval = ?, position = ?, is_visible = ?
      WHERE id = ?
    `, [
      name,
      JSON.stringify(images || []),
      auto_play ? 1 : 0,
      interval || 5000,
      position,
      is_visible ? 1 : 0,
      id
    ]);

    const db = await getDb();
    await db.export();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating landing slider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/landing/sliders - Delete a landing slider
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }
    
    if (session.role !== 'admin') {
      return createForbiddenResponse('Admin access required');
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Slider ID is required' }, { status: 400 });
    }
    
    await run('DELETE FROM landing_sliders WHERE id = ?', [id]);

    const db = await getDb();
    await db.export();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting landing slider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
