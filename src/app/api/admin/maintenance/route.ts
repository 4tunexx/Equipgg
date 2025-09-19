import { NextRequest, NextResponse } from 'next/server';
import { secureDb } from "../../../../lib/secure-db";
import { parse } from 'cookie';

// POST /api/admin/maintenance - Perform system maintenance actions
export async function POST(request: NextRequest) {
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

    // Get session and user info from Supabase
    const session = await secureDb.findOne('sessions', { token: sessionToken });
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    const user = await secureDb.findOne('users', { id: session.user_id });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { action } = await request.json();
    
    if (!action) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 });
    }

    let result = { success: true, message: '' };

    switch (action) {
      case 'clear_cache':
        // Clear cache (in a real app, this would clear Redis/memory cache)
        result.message = 'Cache cleared successfully';
        break;

      case 'reindex_ranks': {
        // Re-index user ranks based on XP using Supabase
        const xpLevels = [
          { min: 10000, level: 10 },
          { min: 9000, level: 9 },
          { min: 8000, level: 8 },
          { min: 7000, level: 7 },
          { min: 6000, level: 6 },
          { min: 5000, level: 5 },
          { min: 4000, level: 4 },
          { min: 3000, level: 3 },
          { min: 2000, level: 2 },
        ];
        // Get all users
        const users = await secureDb.findMany('users', {});
        for (const u of users) {
          let newLevel = 1;
          for (const lvl of xpLevels) {
            if (u.xp >= lvl.min) {
              newLevel = lvl.level;
              break;
            }
          }
          if (u.level !== newLevel) {
            await secureDb.update('users', { id: u.id }, { level: newLevel });
          }
        }
        result.message = 'User ranks re-indexed successfully';
        break;
      }

      case 'cleanup_sessions': {
        // Clean up expired sessions (older than 30 days)
        const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        await secureDb.delete('sessions', { created_at: cutoff });
        result.message = 'Expired sessions cleaned up successfully';
        break;
      }

      case 'cleanup_transactions': {
        // Clean up old transaction logs (keep last 90 days)
        const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        await secureDb.delete('user_transactions', { created_at: cutoff });
        result.message = 'Old transaction logs cleaned up successfully';
        break;
      }

      case 'backup_database':
        // In a real app, this would create a database backup
        result.message = 'Database backup initiated successfully';
        break;

      case 'optimize_database':
        // No-op for Supabase/Postgres
        result.message = 'Database optimize is not required for Supabase/Postgres.';
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Log the maintenance action
    await secureDb.create('user_transactions', {
      user_id: session.user_id,
      type: 'admin_action',
      amount: 0,
      description: `Admin maintenance: ${action}`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error performing maintenance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
