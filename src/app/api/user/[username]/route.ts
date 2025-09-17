import { NextRequest, NextResponse } from 'next/server';
import { getDb, getOne } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    await getDb();

    // Get user data by username (displayName)
    const user = await getOne(`
      SELECT id, displayName, role, xp, level, avatar_url as avatarUrl, created_at
      FROM users 
      WHERE displayName = ? OR email = ?
    `, [username, username]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return public user data (no sensitive information)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.displayName,
        displayName: user.displayName,
        username: user.displayName,
        role: user.role || 'user',
        xp: user.xp || 0,
        level: user.level || 1,
        avatar: user.avatarUrl || `https://picsum.photos/40/40?random=${user.id}`,
        avatarUrl: user.avatarUrl,
        createdAt: user.created_at,
        dataAiHint: 'user avatar'
      }
    });

  } catch (error) {
    console.error('Error fetching user by username:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}