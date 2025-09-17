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
    
    // Get all active perks for the user
    const perks = await getAll<{
      id: string;
      perk_id: string;
      perk_name: string;
      perk_type: string;
      duration_hours: number | null;
      expires_at: string | null;
      is_active: boolean;
      applied_at: string;
    }>(`
      SELECT id, perk_id, perk_name, perk_type, duration_hours, expires_at, is_active, applied_at
      FROM user_perks 
      WHERE user_id = ? AND is_active = 1
      ORDER BY applied_at DESC
    `, [session.user_id]);

    // Filter out expired perks
    const now = new Date();
    const activePerks = perks.filter(perk => {
      if (!perk.expires_at) return true; // Permanent perks
      return new Date(perk.expires_at) > now;
    });

    // Deactivate expired perks
    const expiredPerks = perks.filter(perk => {
      if (!perk.expires_at) return false; // Permanent perks don't expire
      return new Date(perk.expires_at) <= now;
    });

    if (expiredPerks.length > 0) {
      const expiredIds = expiredPerks.map(p => p.id);
      await db.run(`
        UPDATE user_perks 
        SET is_active = 0 
        WHERE id IN (${expiredIds.map(() => '?').join(',')})
      `, expiredIds);
    }

    return NextResponse.json({
      success: true,
      perks: activePerks
    });

  } catch (error) {
    console.error('Get user perks error:', error);
    return NextResponse.json({ error: 'Failed to get user perks' }, { status: 500 });
  }
}
