import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

async function authenticateAdmin(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return null;
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  return { user, role: profile?.role || 'user' };
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authResult.role !== 'admin' && authResult.role !== 'moderator') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch missions from Supabase
    const { data: missions, error } = await supabase
      .from('missions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching missions:', error);
      return NextResponse.json({ error: 'Failed to fetch missions' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      missions: missions || []
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
    const authResult = await authenticateAdmin(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authResult.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only admins can create missions' }, { status: 403 });
    }

    const { title, description, type, reward, requirement, isActive } = await request.json();

    if (!title || !description || !type || !reward || !requirement) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const missionId = uuidv4();
    const timestamp = new Date().toISOString();

    const { data: newMission, error } = await supabase
      .from('missions')
      .insert({
        id: missionId,
        title,
        description,
        type,
        reward,
        requirement,
        is_active: isActive !== false,
        created_at: timestamp
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating mission:', error);
      return NextResponse.json({ error: 'Failed to create mission' }, { status: 500 });
    }

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
    const authResult = await authenticateAdmin(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authResult.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only admins can update missions' }, { status: 403 });
    }

    const { id, title, description, type, reward, requirement, isActive } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Mission ID is required' }, { status: 400 });
    }

    const { data: updatedMission, error } = await supabase
      .from('missions')
      .update({
        title,
        description,
        type,
        reward,
        requirement,
        is_active: isActive
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating mission:', error);
      return NextResponse.json({ error: 'Failed to update mission' }, { status: 500 });
    }

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
    const authResult = await authenticateAdmin(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authResult.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only admins can delete missions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const missionId = searchParams.get('id');

    if (!missionId) {
      return NextResponse.json({ error: 'Mission ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('missions')
      .delete()
      .eq('id', missionId);

    if (error) {
      console.error('Error deleting mission:', error);
      return NextResponse.json({ error: 'Failed to delete mission' }, { status: 500 });
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
