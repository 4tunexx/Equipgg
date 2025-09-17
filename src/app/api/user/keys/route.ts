import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-utils';
import { getDb, getAll } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await getDb();

    // Get user's keys for all crates
    const userKeys = await getAll(`
      SELECT crate_id, keys_count 
      FROM user_keys 
      WHERE user_id = ?
    `, [session.user_id]);

    // Convert to object format expected by frontend
    const keysObject: Record<string, number> = {};
    userKeys.forEach((key: any) => {
      keysObject[key.crate_id] = key.keys_count;
    });

    return NextResponse.json({ 
      keys: keysObject,
      timestamp: Date.now() // Add timestamp for cache busting
    });

  } catch (error) {
    console.error('Error fetching user keys:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
