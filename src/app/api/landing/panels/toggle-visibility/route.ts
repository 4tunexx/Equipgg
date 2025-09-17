import { NextRequest, NextResponse } from 'next/server';
import { getDb, getOne, run } from '@/lib/db';
import { getAuthSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth-utils';

// POST /api/landing/panels/toggle-visibility - Toggle panel visibility
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }
    
    if (session.role !== 'admin') {
      return createForbiddenResponse('Admin access required');
    }

    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Panel ID is required' }, { status: 400 });
    }

    // Get current panel
    const panel = await getOne('SELECT * FROM landing_panels WHERE id = ?', [id]);
    
    if (!panel) {
      return NextResponse.json({ error: 'Panel not found' }, { status: 404 });
    }

    // Toggle visibility
    const newVisibility = panel.is_visible ? 0 : 1;
    
    await run('UPDATE landing_panels SET is_visible = ? WHERE id = ?', [newVisibility, id]);

    const db = await getDb();
    await db.export();

    return NextResponse.json({ success: true, is_visible: newVisibility === 1 });
  } catch (error) {
    console.error('Error toggling panel visibility:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
