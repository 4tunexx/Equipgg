import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-utils';
import { getDb, getAll } from '@/lib/db';

interface MissionProgress {
  mission_id: string;
  progress: number;
}

export async function GET(req: NextRequest) {
  try {
    await getDb();
    const session = await getAuthSession(req);
    
    // Get total daily missions from database
    const dailyMissionsCount = await getAll(
      'SELECT COUNT(*) as count FROM missions WHERE type = ? AND is_active = 1', 
      ['daily']
    );
    const totalDaily = dailyMissionsCount[0]?.count || 0;
    
    if (!session) {
      return NextResponse.json({ dailyCompleted: 0, totalDaily });
    }
    
    // Get user's mission progress
    const rows = await getAll<MissionProgress>(
      'SELECT mission_id, progress FROM user_mission_progress WHERE user_id = ?', 
      [session.user_id]
    );
    
    // Get completed daily missions
    const completed = new Set(
      rows.filter(r => Number(r.progress) >= 100).map(r => r.mission_id as string)
    );
    
    // Count completed daily missions
    const dailyMissions = await getAll(
      'SELECT id FROM missions WHERE type = ? AND is_active = 1', 
      ['daily']
    );
    const dailyCompleted = dailyMissions.filter(m => completed.has(m.id as string)).length;
    
    return NextResponse.json({ dailyCompleted, totalDaily });
  } catch (error) {
    console.error('Error in /api/missions/summary:', error);
    return NextResponse.json({ dailyCompleted: 0, totalDaily: 0 });
  }
}


