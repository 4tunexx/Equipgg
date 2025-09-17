import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';
import { getDb, getAll } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const db = await getDb();
    
    // Get all active missions from database
    const missions = await getAll(
      `SELECT 
        id,
        title,
        description,
        type,
        tier,
        xp_reward,
        coin_reward,
        gem_reward,
        crate_reward,
        requirement_type,
        requirement_value,
        is_active,
        created_at
       FROM missions 
       WHERE is_active = 1
       ORDER BY tier ASC, type ASC, id ASC`
    );
    
    return NextResponse.json({
      success: true,
      missions
    });

  } catch (error) {
    console.error('Error fetching missions:', error);
    return NextResponse.json({ error: 'Failed to fetch missions' }, { status: 500 });
  }
}
