import { NextRequest, NextResponse } from 'next/server';
import { getDb, getOne, run } from '@/lib/db';
import { parse } from 'cookie';
import { v4 as uuidv4 } from 'uuid';

// POST /api/admin/moderation - Apply moderation action to user
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
    
    // Check if user is admin or moderator
    if (!['admin', 'moderator'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin/Moderator access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, action, reason, duration } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Valid actions
    const validActions = ['warn', 'mute', 'ban', 'suspend', 'unmute', 'unban'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Calculate expiration if duration is provided
    let expiresAt = null;
    if (duration && ['mute', 'ban', 'suspend'].includes(action)) {
      const durationMs = parseDuration(duration);
      if (durationMs) {
        expiresAt = new Date(Date.now() + durationMs).toISOString();
      }
    }

    // Deactivate any existing active moderation for this user and action type
    await run(
      'UPDATE user_moderation SET active = 0 WHERE user_id = ? AND action = ? AND active = 1',
      [userId, action]
    );

    // Create new moderation record
    const moderationId = uuidv4();
    await run(
      `INSERT INTO user_moderation (
        id, user_id, action, reason, moderator_id, active, created_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?)`,
      [moderationId, userId, action, reason || null, session.user_id, 1, expiresAt]
    );

    // Apply the moderation action to the user record if needed
    if (action === 'ban') {
      // Mark user as banned - you might want to add a banned column to users table
    } else if (action === 'unban') {
      // Unban user
      await run(
        'UPDATE user_moderation SET active = 0 WHERE user_id = ? AND action = "ban" AND active = 1',
        [userId]
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `User ${action}ed successfully`,
      moderationId 
    });

  } catch (error) {
    console.error('Error applying moderation action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function parseDuration(duration: string): number | null {
  const match = duration.match(/^(\d+)([dhm])$/);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 'm': return value * 60 * 1000; // minutes
    case 'h': return value * 60 * 60 * 1000; // hours
    case 'd': return value * 24 * 60 * 60 * 1000; // days
    default: return null;
  }
}