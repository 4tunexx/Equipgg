import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';
import { getActiveServerSeed, generateServerSeed } from '@/lib/provablyFair';

// Get current server seed (hashed)
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    let activeSeed = await getActiveServerSeed();
    
    // Generate first seed if none exists
    if (!activeSeed) {
      activeSeed = await generateServerSeed();
    }

    return NextResponse.json({
      success: true,
      serverSeed: {
        id: activeSeed.id,
        hashedSeed: activeSeed.hashedSeed,
        createdAt: activeSeed.createdAt
      }
    });

  } catch (error) {
    console.error('Get server seed error:', error);
    return NextResponse.json({ error: 'Failed to get server seed' }, { status: 500 });
  }
}

// Generate new server seed (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    // Check if user is admin
    const { getOne } = await import('@/lib/db');
    const user = await getOne('SELECT role FROM users WHERE id = ?', [session.user_id]);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const newSeed = await generateServerSeed();

    return NextResponse.json({
      success: true,
      serverSeed: {
        id: newSeed.id,
        hashedSeed: newSeed.hashedSeed,
        createdAt: newSeed.createdAt
      }
    });

  } catch (error) {
    console.error('Generate server seed error:', error);
    return NextResponse.json({ error: 'Failed to generate server seed' }, { status: 500 });
  }
}
