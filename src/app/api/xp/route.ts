import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';
import { addXP, getUserXPInfo, getXPRequirements } from '@/lib/xp-service';
import { defaultXPConfig } from '@/lib/xp-config';

// GET /api/xp - Get user's XP information
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const userXPInfo = await getUserXPInfo(session.user_id);
    
    if (!userXPInfo) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      xp: userXPInfo.xp,
      level: userXPInfo.level,
      levelInfo: userXPInfo.levelInfo
    });

  } catch (error) {
    console.error('Error fetching XP info:', error);
    return NextResponse.json({ error: 'Failed to fetch XP information' }, { status: 500 });
  }
}

// POST /api/xp - Add XP to user (admin only or system)
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const { amount, source, reason, userId } = await request.json();

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount required' }, { status: 400 });
    }

    if (!source) {
      return NextResponse.json({ error: 'Source required' }, { status: 400 });
    }

    // Check if user is admin or if adding XP to themselves
    const targetUserId = userId || session.user_id;
    
    if (targetUserId !== session.user_id) {
      // Check if user is admin
      const user = await getUserXPInfo(session.user_id);
      if (!user || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const result = await addXP(
      targetUserId,
      amount,
      source,
      reason || 'XP Award'
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      newXP: result.newXP,
      newLevel: result.newLevel,
      leveledUp: result.leveledUp,
      levelsGained: result.levelsGained,
      levelInfo: result.levelInfo,
      transaction: result.transaction
    });

  } catch (error) {
    console.error('Error adding XP:', error);
    return NextResponse.json({ error: 'Failed to add XP' }, { status: 500 });
  }
}
