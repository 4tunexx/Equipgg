import { NextRequest, NextResponse } from 'next/server';
import { getDb, getOne, getAll, run } from '@/lib/db';
import { getAuthSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth-utils';

// GET /api/landing/panels - Get all landing panels
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }
    
    if (session.role !== 'admin') {
      return createForbiddenResponse('Admin access required');
    }

    const panels = await getAll(`
      SELECT * FROM landing_panels 
      ORDER BY position ASC
    `, []);

    return NextResponse.json(panels);
  } catch (error) {
    console.error('Error fetching landing panels:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/landing/panels - Create a new landing panel
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }
    
    if (session.role !== 'admin') {
      return createForbiddenResponse('Admin access required');
    }

    const { name, type, position, is_visible, settings } = await request.json();
    
    const panelId = `panel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await run(`
      INSERT INTO landing_panels (id, name, type, position, is_visible, settings, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      panelId,
      name,
      type,
      position,
      is_visible ? 1 : 0,
      JSON.stringify(settings || {}),
      new Date().toISOString()
    ]);

    const db = await getDb();
    await db.export();

    return NextResponse.json({ success: true, id: panelId });
  } catch (error) {
    console.error('Error creating landing panel:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/landing/panels - Update a landing panel
export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }
    
    if (session.role !== 'admin') {
      return createForbiddenResponse('Admin access required');
    }

    const { id, name, type, position, is_visible, settings } = await request.json();
    
    await run(`
      UPDATE landing_panels 
      SET name = ?, type = ?, position = ?, is_visible = ?, settings = ?
      WHERE id = ?
    `, [
      name,
      type,
      position,
      is_visible ? 1 : 0,
      JSON.stringify(settings || {}),
      id
    ]);

    const db = await getDb();
    await db.export();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating landing panel:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/landing/panels - Delete a landing panel
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
      return NextResponse.json({ error: 'Panel ID is required' }, { status: 400 });
    }
    
    await run('DELETE FROM landing_panels WHERE id = ?', [id]);

    const db = await getDb();
    await db.export();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting landing panel:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
