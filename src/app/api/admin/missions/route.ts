import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse, createForbiddenResponse } from "../../../../lib/auth-utils";
import { secureDb } from "../../../../lib/secure-db";
import { v4 as uuidv4 } from 'uuid';

// Map textual tier labels (bronze/silver/gold/platinum) to numeric tiers if needed
function tierToNumeric(value: string): number {
  const map: Record<string, number> = { bronze: 1, silver: 2, gold: 3, platinum: 4 };
  const lower = value.toLowerCase();
  return map[lower] || parseInt(value) || 1;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return createUnauthorizedResponse();
    }

    if (session.role !== 'admin' && session.role !== 'moderator') {
      return createForbiddenResponse('You do not have permission to access admin functions.');
    }

    // Fetch missions from Supabase (order by created_at desc)
    const missions = await secureDb.findMany('missions', {}, { orderBy: 'created_at DESC' });
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

    const { title, description, type, tier, target_value, reward_coins, reward_xp, reward_item, is_active } = await request.json();

    if (!title || !description || !type || typeof tier === 'undefined') {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    // Map UI fields to DB schema
    // UI: title -> missions.name, type -> missions.mission_type
    const missionId = undefined; // missions.id is serial; let DB assign

    const newMission = await secureDb.create('missions', {
      name: String(title).slice(0, 200),
      description,
      mission_type: type,
      tier: typeof tier === 'string' ? tierToNumeric(tier) : tier,
      target_value: target_value || 1,
      xp_reward: reward_xp || 0,
      coin_reward: reward_coins || 0,
      requirement_type: reward_item ? 'item' : null,
      requirement_value: reward_item ? 1 : 1,
      is_active: is_active !== false
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

    const { id, title, description, type, tier, target_value, reward_coins, reward_xp, reward_item, is_active } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Mission ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (title) updateData.name = String(title).slice(0, 200);
    if (description) updateData.description = description;
    if (type) updateData.mission_type = type;
    if (typeof tier !== 'undefined') updateData.tier = typeof tier === 'string' ? tierToNumeric(tier) : tier;
    if (typeof target_value !== 'undefined') updateData.target_value = target_value;
    if (typeof reward_xp !== 'undefined') updateData.xp_reward = reward_xp;
    if (typeof reward_coins !== 'undefined') updateData.coin_reward = reward_coins;
    if (typeof is_active !== 'undefined') updateData.is_active = is_active;
    // reward_item mapping: could be separate item grant system; store requirement fields only if relevant
    if (reward_item) {
      updateData.requirement_type = 'item';
      updateData.requirement_value = 1;
    }

    const updatedMission = await secureDb.update('missions', { id }, updateData);
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

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return createUnauthorizedResponse();
    }

    if (session.role !== 'admin') {
      return createForbiddenResponse('Only admins can update mission status.');
    }

  const { missionId, isActive } = await request.json();

    if (!missionId) {
      return NextResponse.json({ error: 'Mission ID is required' }, { status: 400 });
    }

    const updatedMission = await secureDb.update('missions', { id: missionId }, { is_active: isActive });

    return NextResponse.json({
      success: true,
      message: `Mission ${isActive ? 'enabled' : 'disabled'} successfully`,
      mission: updatedMission
    });

  } catch (error) {
    console.error('Error updating mission status:', error);
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
