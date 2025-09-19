import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse, createForbiddenResponse } from "../../../../lib/auth-utils";
import { supabase } from "../../../../lib/supabase/client";
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

    const { data: crates, error } = await supabase
      .from('crates')
      .select('*');

    if (error) {
      console.error('Error fetching admin crates:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      crates
    });

  } catch (error) {
    console.error('Error fetching admin crates:', error);
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
      return createForbiddenResponse('Only admins can create crates.');
    }

    const { name, description, price, image, contents, isActive } = await request.json();

    if (!name || !description || !price || !contents) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const newCrate = {
      id: uuidv4(),
      name,
      description,
      price: parseInt(price),
      image: image || 'https://picsum.photos/200/200',
      contents: Array.isArray(contents) ? contents : [],
      is_active: isActive !== false,
    };

    const { data, error } = await supabase
      .from('crates')
      .insert(newCrate)
      .select()
      .single();

    if (error) {
      console.error('Error creating crate:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Crate created successfully',
      crate: data
    });

  } catch (error) {
    console.error('Error creating crate:', error);
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
      return createForbiddenResponse('Only admins can update crates.');
    }

    const { id, name, description, price, image, contents, isActive } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Crate ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('crates')
      .update({
        name,
        description,
        price,
        image,
        contents,
        is_active: isActive,
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating crate:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Crate updated successfully'
    });

  } catch (error) {
    console.error('Error updating crate:', error);
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
      return createForbiddenResponse('Only admins can delete crates.');
    }

    const { searchParams } = new URL(request.url);
    const crateId = searchParams.get('id');

    if (!crateId) {
      return NextResponse.json({ error: 'Crate ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('crates')
      .delete()
      .eq('id', crateId);

    if (error) {
      console.error('Error deleting crate:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Crate deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting crate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
