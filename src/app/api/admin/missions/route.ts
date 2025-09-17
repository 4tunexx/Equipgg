import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth-utils';
import { getDb, getAll, getOne, run } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return createUnauthorizedResponse();
    }

    if (session.role !== 'admin' && session.role !== 'moderator') {
      return createForbiddenResponse('You do not have permission to access admin functions.');
    }

    await getDb();

    // Mock mission data (in a real app, this would come from a missions table)
    const missions = [
      {
        id: 'mission-1',
        title: 'Daily Login',
        description: 'Log in to the platform',
        type: 'daily',
        reward: { coins: 100, xp: 50 },
        requirement: { type: 'login', value: 1 },
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'mission-2',
        title: 'Place 5 Bets',
        description: 'Place 5 bets on matches',
        type: 'daily',
        reward: { coins: 500, xp: 200 },
        requirement: { type: 'bets', value: 5 },
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'mission-3',
        title: 'Win 3 Bets',
        description: 'Win 3 bets in a row',
        type: 'weekly',
        reward: { coins: 1000, xp: 500, gems: 10 },
        requirement: { type: 'win_streak', value: 3 },
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];

    return NextResponse.json({
      success: true,
      missions
    });

  } catch (error) {
    console.error('Error fetching admin missions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return createUnauthorizedResponse();
    }

    if (session.role !== 'admin') {
      return createForbiddenResponse('Only admins can create missions.');
    }

    const { title, description, type, reward, requirement, isActive } = await request.json();

    if (!title || !description || !type || !reward || !requirement) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const missionId = uuidv4();
    const timestamp = new Date().toISOString();

    const newMission = {
      id: missionId,
      title,
      description,
      type,
      reward,
      requirement,
      isActive: isActive !== false,
      createdAt: timestamp
    };

    return NextResponse.json({
      success: true,
      message: 'Mission created successfully',
      mission: newMission
    });

  } catch (error) {
    console.error('Error creating mission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return createUnauthorizedResponse();
    }

    if (session.role !== 'admin') {
      return createForbiddenResponse('Only admins can update missions.');
    }

    const { id, title, description, type, reward, requirement, isActive } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Mission ID is required' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Mission updated successfully'
    });

  } catch (error) {
    console.error('Error updating mission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return createUnauthorizedResponse();
    }

    if (session.role !== 'admin') {
      return createForbiddenResponse('Only admins can delete missions.');
    }

    const { searchParams } = new URL(request.url);
    const missionId = searchParams.get('id');

    if (!missionId) {
      return NextResponse.json({ error: 'Mission ID is required' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Mission deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting mission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
