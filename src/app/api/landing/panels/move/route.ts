import { NextRequest, NextResponse } from 'next/server';
import { getDb, getAll, run } from '@/lib/db';
import { getAuthSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth-utils';

// POST /api/landing/panels/move - Move a panel up or down
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }
    
    if (session.role !== 'admin') {
      return createForbiddenResponse('Admin access required');
    }

    const { id, direction } = await request.json();
    
    if (!id || !direction || !['up', 'down'].includes(direction)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Get all panels ordered by position
    const panels = await getAll('SELECT * FROM landing_panels ORDER BY position ASC', []);
    
    const currentIndex = panels.findIndex(panel => panel.id === id);
    if (currentIndex === -1) {
      return NextResponse.json({ error: 'Panel not found' }, { status: 404 });
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= panels.length) {
      return NextResponse.json({ error: 'Cannot move panel in that direction' }, { status: 400 });
    }

    // Swap positions
    const currentPanel = panels[currentIndex];
    const targetPanel = panels[newIndex];
    
    await run('UPDATE landing_panels SET position = ? WHERE id = ?', [targetPanel.position, currentPanel.id]);
    await run('UPDATE landing_panels SET position = ? WHERE id = ?', [currentPanel.position, targetPanel.id]);

    const db = await getDb();
    await db.export();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error moving panel:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
