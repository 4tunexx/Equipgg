import { NextRequest, NextResponse } from 'next/server';
import { getDb, getOne, run } from '@/lib/db';
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
        
      case 'reindex_ranks':
        // Re-index user ranks based on XP
        await run(`
          UPDATE users SET level = 
            CASE 
              WHEN xp >= 10000 THEN 10
              WHEN xp >= 9000 THEN 9
              WHEN xp >= 8000 THEN 8
              WHEN xp >= 7000 THEN 7
              WHEN xp >= 6000 THEN 6
              WHEN xp >= 5000 THEN 5
              WHEN xp >= 4000 THEN 4
              WHEN xp >= 3000 THEN 3
              WHEN xp >= 2000 THEN 2
              ELSE 1
            END
        `);
        result.message = 'User ranks re-indexed successfully';
        break;
        
      case 'cleanup_sessions':
        // Clean up expired sessions
        await run('DELETE FROM sessions WHERE created_at < datetime("now", "-30 days")');
        result.message = 'Expired sessions cleaned up successfully';
        break;
        
      case 'cleanup_transactions':
        // Clean up old transaction logs (keep last 90 days)
        await run('DELETE FROM user_transactions WHERE created_at < datetime("now", "-90 days")');
        result.message = 'Old transaction logs cleaned up successfully';
        break;
        
      case 'backup_database':
        // In a real app, this would create a database backup
        result.message = 'Database backup initiated successfully';
        break;
        
      case 'optimize_database':
        // Optimize database (SQLite specific)
        await run('VACUUM');
        await run('ANALYZE');
        result.message = 'Database optimized successfully';
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Log the maintenance action
    await run(
      'INSERT INTO user_transactions (user_id, type, amount, description, created_at) VALUES (?, ?, ?, ?, datetime("now"))',
      [session.user_id, 'admin_action', 0, `Admin maintenance: ${action}`]
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error performing maintenance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
