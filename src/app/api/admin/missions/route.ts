import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse, createForbiddenResponse } from "../../../../lib/auth-utils";
import { secureDb } from "../../../../lib/secure-db";
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

    // Fetch missions from Supabase
    const missions = await secureDb.findMany('missions', {}, { orderBy: 'createdAt DESC' });
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

    const newMission = await secureDb.create('missions', {
      id: missionId,
      title,
      description,
      type,
      reward,
      requirement,
      isActive: isActive !== false,
      createdAt: timestamp
    });
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

    const updatedMission = await secureDb.update('missions', { id }, {
      title,
      description,
      type,
      reward,
      requirement,
      isActive
    });
    return NextResponse.json({
      success: true,
      message: 'Mission updated successfully',
      mission: updatedMission
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

    await secureDb.delete('missions', { id: missionId });
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
