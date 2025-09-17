import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';
import { getDb, getAll, run } from '@/lib/db';

interface UserMissionProgress {
  mission_id: string;
  progress: number;
  completed: boolean;
  last_updated: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    // Initialize database
    const db = await getDb();
    
    // Get user's mission progress from database
    const userMissionProgress = await getAll<UserMissionProgress>(
      `SELECT mission_id, progress, completed, last_updated 
       FROM user_mission_progress 
       WHERE user_id = ?
       ORDER BY last_updated DESC`,
      [session.user_id]
    );
    
    // Get all active missions from database
    const allMissions = await getAll(
      'SELECT id FROM missions WHERE is_active = 1'
    );
    
    // Initialize all missions to 0 progress
    const progressMap: { [key: string]: number } = {};
    allMissions.forEach(mission => {
      progressMap[mission.id] = 0;
    });
    
    // Override with actual progress
    userMissionProgress.forEach(mission => {
      progressMap[mission.mission_id] = mission.progress;
    });
    
    return NextResponse.json(progressMap);
    
  } catch (error) {
    console.error('Error fetching mission progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const { missionId, progress } = await request.json();
    
    if (!missionId || typeof progress !== 'number') {
      return NextResponse.json(
        { error: 'Mission ID and progress are required' },
        { status: 400 }
      );
    }
    
    // Initialize database
    const db = await getDb();
    
    // Update or insert mission progress
    const completed = progress >= 100;
    await run(
      `INSERT OR REPLACE INTO user_mission_progress 
       (user_id, mission_id, progress, completed, last_updated) 
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [session.user_id, missionId, progress, completed]
    );
    
    return NextResponse.json({ 
      success: true, 
      missionId, 
      progress, 
      completed 
    });
    
  } catch (error) {
    console.error('Error updating mission progress:', error);
    return NextResponse.json(
      { error: 'Failed to update mission progress' },
      { status: 500 }
    );
  }
}