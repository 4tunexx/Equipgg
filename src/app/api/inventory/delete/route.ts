import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';
import { getDb, getOne, run } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const { itemId } = await request.json();

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const db = await getDb();
    
    // Check if item exists and belongs to user
    const item = await getOne<{id: string, user_id: string, item_name: string}>(
      'SELECT id, user_id, item_name FROM user_inventory WHERE id = ? AND user_id = ?',
      [itemId, session.user_id]
    );

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Delete the item
    await run('DELETE FROM user_inventory WHERE id = ?', [itemId]);

    // Persist changes to database
    await db.export();

    return NextResponse.json({
      success: true,
      message: `${item.item_name} deleted successfully`
    });

  } catch (error) {
    console.error('Delete item error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
