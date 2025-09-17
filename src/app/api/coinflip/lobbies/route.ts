import { NextRequest, NextResponse } from 'next/server';
import { getDb, getOne, getAll, run } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-utils';
import { logActivity } from '@/lib/activity-logger';
import { parse } from 'cookie';

interface CoinflipLobby {
  id: string;
  creator_id: string;
  creator_name: string;
  creator_avatar?: string;
  bet_amount: number;
  side: 'heads' | 'tails';
  status: 'waiting' | 'playing' | 'completed';
  created_at: string;
  expires_at: string;
}

// Cleanup expired lobbies and return coins to creators
async function cleanupExpiredLobbies() {
  try {
    const expiredLobbies = await getAll<{id: string, creator_id: string, bet_amount: number, creator_name: string}>(
      `SELECT cl.id, cl.creator_id, cl.bet_amount, u.displayName as creator_name 
       FROM coinflip_lobbies cl
       JOIN users u ON cl.creator_id = u.id
       WHERE cl.status = 'waiting' AND cl.expires_at <= datetime('now')`
    );

    for (const lobby of expiredLobbies) {
      // Return coins to creator
      await run(
        'UPDATE users SET coins = coins + ? WHERE id = ?',
        [lobby.bet_amount, lobby.creator_id]
      );
      
      // Log activity for coin return
      await logActivity({
        userId: lobby.creator_id,
        username: lobby.creator_name,
        activityType: 'bet_placed', // Using bet_placed as a generic activity type
        amount: lobby.bet_amount,
        gameType: 'coinflip'
      });
      
      // DELETE the lobby completely - no more flickering!
      await run(
        'DELETE FROM coinflip_lobbies WHERE id = ?',
        [lobby.id]
      );
    }

    if (expiredLobbies.length > 0) {
      console.log(`Deleted ${expiredLobbies.length} expired coinflip lobbies and returned coins`);
    }
  } catch (error) {
    console.error('Error cleaning up expired lobbies:', error);
  }
}

// GET - Fetch active lobbies
export async function GET(request: NextRequest) {
  try {
    console.log('Coinflip lobbies GET request received');
    // Initialize database first
    await getDb();
    
    // Clean up expired lobbies first (always run cleanup on every request)
    await cleanupExpiredLobbies();
    
    // Get authenticated session with robust error handling
    let session = await getAuthSession(request);
    
    // If session fails, try to get user from cookie directly
    if (!session) {
      console.log('getAuthSession failed, trying direct cookie authentication');
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = parse(cookieHeader);
        const sessionToken = cookies['equipgg_session'];
        
        if (sessionToken) {
          // Try to get session directly from database
          session = await getOne(
            'SELECT s.*, u.email, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?',
            [sessionToken]
          );
          
          if (session) {
            console.log('Direct cookie authentication successful for user:', session.email);
          } else {
            console.log('Session not found in database, but token exists in cookie');
            // Session exists in cookie but not in database - this is the corruption issue
            // For now, allow access but log the issue
            console.log('WARNING: Session corruption detected - token exists in cookie but not in database');
          }
        }
      }
    }
    
    if (!session) {
      console.log('No valid session found for coinflip lobbies request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('Coinflip lobbies - Session found for user:', session.email, 'role:', session.role);

    const lobbies = await getAll<CoinflipLobby>(
      `SELECT 
        cl.id,
        cl.creator_id,
        u.displayName as creator_name,
        u.avatar_url as creator_avatar,
        cl.bet_amount,
        cl.side,
        cl.status,
        cl.created_at,
        cl.expires_at
      FROM coinflip_lobbies cl
      JOIN users u ON cl.creator_id = u.id
      WHERE cl.status = 'waiting' AND cl.expires_at > datetime('now')
      ORDER BY cl.created_at DESC
      LIMIT 20`,
      []
    );

    // Calculate time left for each lobby and filter out expired ones
    const lobbiesWithTimeLeft = lobbies
      .map(lobby => {
        const expiresAt = new Date(lobby.expires_at);
        const now = new Date();
        const timeLeftMs = expiresAt.getTime() - now.getTime();
        
        // If lobby is expired, don't include it
        if (timeLeftMs <= 0) {
          return null;
        }
        
        const timeLeftMinutes = Math.floor(timeLeftMs / 60000);
        const timeLeftSeconds = Math.floor((timeLeftMs % 60000) / 1000);
        const timeLeft = `${timeLeftMinutes}:${timeLeftSeconds.toString().padStart(2, '0')}`;
        
        return {
          ...lobby,
          timeLeft,
          creator: {
            name: lobby.creator_name,
            avatar: lobby.creator_avatar || '',
            dataAiHint: "lobby creator"
          }
        };
      })
      .filter(lobby => lobby !== null); // Remove null entries (expired lobbies)

    console.log('Coinflip lobbies GET request completed successfully');
    return NextResponse.json({ lobbies: lobbiesWithTimeLeft });
  } catch (error) {
    console.error('Error fetching lobbies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lobbies' },
      { status: 500 }
    );
  }
}

// POST - Create new lobby
export async function POST(request: NextRequest) {
  try {
    // Initialize database first
    await getDb();
    
    // Get authenticated session with robust error handling
    let session = await getAuthSession(request);
    
    // If session fails, try to get user from cookie directly
    if (!session) {
      console.log('getAuthSession failed for lobby creation, trying direct cookie authentication');
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = parse(cookieHeader);
        const sessionToken = cookies['equipgg_session'];
        
        if (sessionToken) {
          // Try to get session directly from database
          session = await getOne(
            'SELECT s.*, u.email, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?',
            [sessionToken]
          );
          
          if (session) {
            console.log('Direct cookie authentication successful for lobby creation, user:', session.email);
          } else {
            console.log('Session not found in database for lobby creation, but token exists in cookie');
            console.log('WARNING: Session corruption detected during lobby creation');
          }
        }
      }
    }
    
    if (!session) {
      console.log('No valid session found for coinflip lobby creation request');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    console.log('Coinflip lobby creation - Session found for user:', session.email, 'role:', session.role);

    const { betAmount, side } = await request.json();

    if (!betAmount || betAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid bet amount' },
        { status: 400 }
      );
    }

    if (!['heads', 'tails'].includes(side)) {
      return NextResponse.json(
        { error: 'Invalid side selection' },
        { status: 400 }
      );
    }

    // Check user balance
    const user = await getOne<{ coins: number }>(
      'SELECT coins FROM users WHERE id = ?',
      [session.user_id as string]
    ) as { coins: number } | null;

    if (!user || user.coins < betAmount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Check if user already has 5 or more active lobbies
    const activeLobbiesCount = await getOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM coinflip_lobbies WHERE creator_id = ? AND status = "waiting"',
      [session.user_id as string]
    ) as { count: number } | null;

    if (activeLobbiesCount && activeLobbiesCount.count >= 5) {
      return NextResponse.json(
        { error: 'You can only have 5 active lobbies at a time' },
        { status: 400 }
      );
    }

    // Create lobby (expires in 5 minutes)
    const lobbyId = `lobby_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await run(
      `INSERT INTO coinflip_lobbies (id, creator_id, bet_amount, side, status, created_at, expires_at)
       VALUES (?, ?, ?, ?, 'waiting', datetime('now'), ?)`,
      [lobbyId, session.user_id as string, betAmount, side, expiresAt]
    );

    // Deduct bet amount from user balance
    await run(
      'UPDATE users SET coins = coins - ? WHERE id = ?',
      [betAmount, session.user_id as string]
    );

    return NextResponse.json({
      message: 'Lobby created successfully',
      lobbyId
    });
  } catch (error) {
    console.error('Error creating lobby:', error);
    return NextResponse.json(
      { error: 'Failed to create lobby' },
      { status: 500 }
    );
  }
}