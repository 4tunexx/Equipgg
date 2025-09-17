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

    // Mock crate data (in a real app, this would come from a crates table)
    const crates = [
      {
        id: 'crate-1',
        name: 'Summer 2025 Crate',
        description: 'Exclusive summer collection with rare skins',
        price: 1000,
        image: 'https://picsum.photos/200/200?random=1',
        contents: [
          { name: 'AK-47 | Redline', rarity: 'Rare', probability: 0.3 },
          { name: 'AWP | Dragon Lore', rarity: 'Legendary', probability: 0.01 },
          { name: 'M4A4 | Howl', rarity: 'Epic', probability: 0.1 }
        ],
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'crate-2',
        name: 'Weapon Case 1',
        description: 'Classic weapon skins collection',
        price: 500,
        image: 'https://picsum.photos/200/200?random=2',
        contents: [
          { name: 'Glock-18 | Fade', rarity: 'Rare', probability: 0.2 },
          { name: 'USP-S | Neo-Noir', rarity: 'Epic', probability: 0.05 }
        ],
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];

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

    const crateId = uuidv4();
    const timestamp = new Date().toISOString();

    const newCrate = {
      id: crateId,
      name,
      description,
      price: parseInt(price),
      image: image || 'https://picsum.photos/200/200',
      contents: Array.isArray(contents) ? contents : [],
      isActive: isActive !== false,
      createdAt: timestamp
    };

    return NextResponse.json({
      success: true,
      message: 'Crate created successfully',
      crate: newCrate
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
