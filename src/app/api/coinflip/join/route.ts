import { NextRequest, NextResponse } from 'next/server';
import { getDb, getOne, run } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-utils';
import { logActivity } from '@/lib/activity-logger';
import { parse } from 'cookie';

interface CoinflipLobby {
  id: string;
  creator_id: string;
  bet_amount: number;
  side: 'heads' | 'tails';
  status: string;
  expires_at: string;
}

interface User {
  id: string;
  name: string;
  avatar?: string;
  coins: number;
}

// POST - Join a lobby
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    
    // Get authenticated session with robust error handling
    let session = await getAuthSession(request);
    
    // If session fails, try to get user from cookie directly
    if (!session) {
      console.log('getAuthSession failed for coinflip join, trying direct cookie authentication');
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
            console.log('Direct cookie authentication successful for coinflip join, user:', session.email);
          } else {
            console.log('Session not found in database for coinflip join, but token exists in cookie');
            console.log('WARNING: Session corruption detected during coinflip join');
          }
        }
      }
    }
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('Coinflip join - Session found for user:', session.email, 'role:', session.role);

    const { lobbyId } = await request.json();

    if (!lobbyId) {
      return NextResponse.json(
        { error: 'Lobby ID is required' },
        { status: 400 }
      );
    }

    // Get lobby details
    const lobby = await getOne<CoinflipLobby>(
      'SELECT * FROM coinflip_lobbies WHERE id = ?',
      [lobbyId]
    );

    if (!lobby) {
      return NextResponse.json(
        { error: 'Lobby not found' },
        { status: 404 }
      );
    }

    if (lobby.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Lobby is no longer available' },
        { status: 400 }
      );
    }

    // Check if lobby has expired
    if (new Date(lobby.expires_at) < new Date()) {
      await run(
        'UPDATE coinflip_lobbies SET status = "expired" WHERE id = ?',
        [lobbyId]
      );
      return NextResponse.json(
        { error: 'Lobby has expired' },
        { status: 400 }
      );
    }

    // Check if user is trying to join their own lobby
    if (lobby.creator_id === session.user_id) {
      return NextResponse.json(
        { error: 'Cannot join your own lobby' },
        { status: 400 }
      );
    }

    // Get joiner details
    const joiner = await getOne<User>(
      'SELECT id, displayName as name, avatar_url as avatar, coins FROM users WHERE id = ?',
      [session.user_id as string]
    ) as User | null;

    if (!joiner || joiner.coins < lobby.bet_amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Get creator details
    const creator = await getOne<User>(
      'SELECT id, displayName as name, avatar_url as avatar, coins FROM users WHERE id = ?',
      [lobby.creator_id]
    );

    if (!creator) {
      return NextResponse.json(
        { error: 'Lobby creator not found' },
        { status: 404 }
      );
    }

    // Update lobby status and set joiner
    await run(
      'UPDATE coinflip_lobbies SET status = "playing", joiner_id = ? WHERE id = ?',
      [session.user_id as string, lobbyId]
    );

    // Deduct bet amount from joiner
    await run(
      'UPDATE users SET coins = coins - ? WHERE id = ?',
      [lobby.bet_amount, session.user_id as string]
    );

    // Simulate coinflip (50/50 chance)
    const flipResult: 'heads' | 'tails' = Math.random() < 0.5 ? 'heads' : 'tails';
    const creatorWins = flipResult === lobby.side;
    const winnerId = creatorWins ? creator.id : joiner.id;
    const loserId = creatorWins ? joiner.id : creator.id;
    const winnerName = creatorWins ? creator.name : joiner.name;
    const loserName = creatorWins ? joiner.name : creator.name;
    
    // Calculate winnings (total pot minus small house edge)
    const totalPot = lobby.bet_amount * 2;
    const houseEdge = Math.floor(totalPot * 0.02); // 2% house edge
    const winnings = totalPot - houseEdge;

    // Award winnings to winner
    await run(
      'UPDATE users SET coins = coins + ? WHERE id = ?',
      [winnings, winnerId]
    );

    // Log activity for winner
    await logActivity({
      userId: winnerId,
      username: winnerName,
      activityType: 'game_win',
      amount: winnings,
      gameType: 'coinflip',
      multiplier: winnings / lobby.bet_amount
    });

    // Log activity for loser
    await logActivity({
      userId: loserId,
      username: loserName,
      activityType: 'game_loss',
      amount: lobby.bet_amount,
      gameType: 'coinflip',
      multiplier: 0
    });

    // Update lobby status and record the flip result
    await run(
      'UPDATE coinflip_lobbies SET status = "completed", winner_id = ?, flip_result = ?, completed_at = datetime("now") WHERE id = ?',
      [winnerId, flipResult, lobbyId]
    );

    // Award XP to both players (10 XP for participating, 5 bonus for winner)
    const baseXP = 10;
    const winnerBonusXP = 5;
    
    // Award XP to creator
    await run(
      'UPDATE users SET xp = xp + ? WHERE id = ?',
      [baseXP + (creatorWins ? winnerBonusXP : 0), lobby.creator_id]
    );
    
    // Award XP to joiner
    await run(
      'UPDATE users SET xp = xp + ? WHERE id = ?',
      [baseXP + (!creatorWins ? winnerBonusXP : 0), session.user_id as string]
    );

    // Update mission progress for both players
    try {
      // Mission updates for winner
      const winnerMissions = [
        { missionId: 'coinflip-winner', progress: 100 },
        { missionId: 'arcade-3', progress: 100 } // Main mission: Win 5 Coinflip games
      ];

      // Mission updates for loser (participation)
      const participationMissions = [
        { missionId: 'arcade-1', progress: 100 } // First arcade game
      ];

      // Update winner's missions
      for (const mission of winnerMissions) {
        await run(
          `INSERT OR REPLACE INTO user_mission_progress 
           (user_id, mission_id, progress, completed, last_updated) 
           VALUES (?, ?, ?, ?, ?)`,
          [winnerId, mission.missionId, mission.progress, mission.progress >= 100 ? 1 : 0, new Date().toISOString()]
        );
      }

      // Update loser's missions
      for (const mission of participationMissions) {
        await run(
          `INSERT OR REPLACE INTO user_mission_progress 
           (user_id, mission_id, progress, completed, last_updated) 
           VALUES (?, ?, ?, ?, ?)`,
          [loserId, mission.missionId, mission.progress, mission.progress >= 100 ? 1 : 0, new Date().toISOString()]
        );
      }
    } catch (missionError) {
      console.error('Error updating mission progress:', missionError);
    }

    // Record game history for both players
    const gameId = `coinflip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Creator's game record
    await run(
      `INSERT INTO game_history (id, user_id, game_type, bet_amount, multiplier, winnings, profit, result, created_at)
       VALUES (?, ?, 'coinflip', ?, ?, ?, ?, ?, datetime('now'))`,
      [
        `${gameId}_creator`,
        lobby.creator_id,
        lobby.bet_amount,
        creatorWins ? winnings / lobby.bet_amount : 0, // Actual multiplier
        creatorWins ? winnings : 0,
        creatorWins ? winnings - lobby.bet_amount : -lobby.bet_amount,
        creatorWins ? 'win' : 'loss'
      ]
    );

    // Joiner's game record
    await run(
      `INSERT INTO game_history (id, user_id, game_type, bet_amount, multiplier, winnings, profit, result, created_at)
       VALUES (?, ?, 'coinflip', ?, ?, ?, ?, ?, datetime('now'))`,
      [
        `${gameId}_joiner`,
        session.user_id as string,
        lobby.bet_amount,
        !creatorWins ? winnings / lobby.bet_amount : 0, // Actual multiplier
        !creatorWins ? winnings : 0,
        !creatorWins ? winnings - lobby.bet_amount : -lobby.bet_amount,
        !creatorWins ? 'win' : 'loss'
      ]
    );

    return NextResponse.json({
      message: 'Game completed successfully',
      result: {
        flipResult,
        winner: {
          id: winnerId,
          name: winnerName
        },
        loser: {
          id: loserId,
          name: loserName
        },
        winnings,
        xpGained: baseXP + winnerBonusXP,
        betAmount: lobby.bet_amount
      }
    });
  } catch (error) {
    console.error('Error joining lobby:', error);
    return NextResponse.json(
      { error: 'Failed to join lobby' },
      { status: 500 }
    );
  }
}