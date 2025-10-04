import { NextRequest, NextResponse } from 'next/server';
import secureDb from "../../../../lib/secureDb";
import { parse } from 'cookie';
import { v4 as uuidv4 } from 'uuid';
import { Session } from '../../../../types/session';
import { User } from '../../../../types/database';
import { ModerationAction, UserModeration } from '../../../../types/moderation';

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
    
    // Get session and user info
    const session = await secureDb.getOne<Session>('sessions', { 
      token: sessionToken 
    });
    
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    // Get user info
    const user = await secureDb.getOne<User>('users', { 
      id: session.user_id 
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if user is admin or moderator
    if (!['admin', 'moderator'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin/Moderator access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, action, reason, duration } = body as { 
      userId: string;
      action: ModerationAction;
      reason?: string;
      duration?: string;
    };

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate expiration if duration is provided
    let expiresAt: string | null = null;
    if (duration && ['mute', 'ban', 'suspend'].includes(action)) {
      const durationMs = parseDuration(duration);
      if (durationMs) {
        expiresAt = new Date(Date.now() + durationMs).toISOString();
      }
    }

    // Deactivate any existing active moderation for this user and action type
    await secureDb.update<UserModeration>('user_moderation', 
      { user_id: userId, action, active: true },
      { active: false }
    );

    // Create new moderation record
    const moderationId = uuidv4();
    await secureDb.insert<UserModeration>('user_moderation', {
      id: moderationId,
      user_id: userId,
      action,
      reason: reason || null,
      moderator_id: session.user_id,
      active: true,
      created_at: new Date().toISOString(),
      expires_at: expiresAt
    });

    // Apply the moderation action to the user record if needed
    if (action === 'ban') {
      await secureDb.update<User>('users',
        { id: userId },
        { banned: true }
      );
    } else if (action === 'unban') {
      await secureDb.update<User>('users',
        { id: userId },
        { banned: false }
      );
      // Also deactivate any active ban records
      await secureDb.update<UserModeration>('user_moderation',
        { user_id: userId, action: 'ban', active: true },
        { active: false }
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