import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';
import { getDb, getOne, run } from '@/lib/db';
import {
  getActiveServerSeed,
  getOrCreateClientSeed,
  getNextNonce,
  recordGameResult,
  generatePlinkoResult,
  generateCrashResult,
  generateCoinflipResult,
  generateSweeperResult,
  generateCrateResult
} from '@/lib/provablyFair';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const { gameType, gameId, betAmount, customClientSeed } = await request.json();

    // SECURITY: Input validation
    if (!gameType || !gameId || betAmount === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate game type
    const validGameTypes = ['plinko', 'crash', 'coinflip', 'sweeper', 'crate'];
    if (!validGameTypes.includes(gameType)) {
      return NextResponse.json({ error: 'Invalid game type' }, { status: 400 });
    }

    // Validate bet amount
    if (typeof betAmount !== 'number' || betAmount <= 0 || betAmount > 1000000) {
      return NextResponse.json({ error: 'Invalid bet amount' }, { status: 400 });
    }

    // Validate game ID format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(gameId)) {
      return NextResponse.json({ error: 'Invalid game ID format' }, { status: 400 });
    }

    // Validate custom client seed if provided
    if (customClientSeed && (typeof customClientSeed !== 'string' || customClientSeed.length > 64)) {
      return NextResponse.json({ error: 'Invalid client seed' }, { status: 400 });
    }

    const db = await getDb();
    
    // Check user balance
    const user = await getOne<{coins: number}>('SELECT coins FROM users WHERE id = ?', [session.user_id]);
    if (!user || user.coins < betAmount) {
      return NextResponse.json({ error: 'Insufficient coins' }, { status: 400 });
    }

    // Get server seed and client seed
    const serverSeed = await getActiveServerSeed();
    if (!serverSeed) {
      return NextResponse.json({ error: 'No active server seed' }, { status: 500 });
    }

    const clientSeed = await getOrCreateClientSeed(session.user_id);
    const nonce = await getNextNonce(session.user_id);

    // Generate HMAC for provably fair randomness
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', serverSeed.seed)
      .update(`${clientSeed.seed}:${nonce}`)
      .digest('hex');

    // Generate game result based on type
    let gameResult: any;
    let winnings = 0;
    let isWin = false;

    switch (gameType) {
      case 'plinko':
        gameResult = generatePlinkoResult(hmac);
        winnings = Math.floor(betAmount * gameResult.multiplier);
        isWin = winnings > betAmount;
        break;

      case 'crash':
        gameResult = generateCrashResult(hmac);
        if (!gameResult.crashed) {
          winnings = Math.floor(betAmount * gameResult.multiplier);
          isWin = true;
        }
        break;

      case 'coinflip':
        gameResult = generateCoinflipResult(hmac);
        // For coinflip, winnings are 2x bet amount (assuming 50/50 odds)
        winnings = betAmount * 2;
        isWin = true; // Always win in this simple implementation
        break;

      case 'sweeper':
        gameResult = generateSweeperResult(hmac);
        // Calculate winnings based on tiles cleared (simplified)
        const tilesCleared = Math.floor(Math.random() * 10) + 1; // Random for demo
        winnings = Math.floor(betAmount * (tilesCleared / 10) * 2);
        isWin = tilesCleared > 5;
        gameResult.tilesCleared = tilesCleared;
        break;

      case 'crate':
        gameResult = generateCrateResult(hmac);
        winnings = gameResult.item.value;
        isWin = winnings > betAmount;
        break;

      default:
        return NextResponse.json({ error: 'Invalid game type' }, { status: 400 });
    }

    // Update user balance
    const newBalance = user.coins - betAmount + winnings;
    await run('UPDATE users SET coins = ? WHERE id = ?', [newBalance, session.user_id]);

    // Record game result for verification
    await recordGameResult(
      session.user_id,
      gameId,
      gameType,
      serverSeed.id,
      clientSeed.id,
      nonce,
      gameResult
    );

    // Record transaction
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await run(
      `INSERT INTO user_transactions (id, user_id, type, amount, currency, description, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [transactionId, session.user_id, 'game_play', -betAmount, 'coins', `${gameType} game`, new Date().toISOString()]
    );

    if (winnings > 0) {
      const winTransactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await run(
        `INSERT INTO user_transactions (id, user_id, type, amount, currency, description, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [winTransactionId, session.user_id, 'game_win', winnings, 'coins', `${gameType} winnings`, new Date().toISOString()]
      );
    }

    // Record in game history
    const gameHistoryId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await run(
      `INSERT INTO game_history (id, user_id, game_type, bet_amount, winnings, profit, multiplier, game_data, result, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        gameHistoryId,
        session.user_id,
        gameType,
        betAmount,
        winnings,
        winnings - betAmount,
        gameResult.multiplier || 1,
        JSON.stringify(gameResult),
        isWin ? 'win' : 'loss',
        new Date().toISOString()
      ]
    );

    // Emit Socket.io events for real-time updates
    if ((global as any).io) {
      // Emit game result
      (global as any).io.emit('game-result', {
        userId: session.user_id,
        gameId,
        gameType,
        result: gameResult,
        winnings,
        isWin,
        timestamp: new Date().toISOString()
      });

      // Emit balance update
      (global as any).io.emit('balance-updated', {
        userId: session.user_id,
        coins: newBalance,
        gems: 0, // Will be updated by balance context
        xp: 0, // Will be updated by balance context
        level: 0, // Will be updated by balance context
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      gameId,
      gameType,
      result: gameResult,
      winnings,
      isWin,
      newBalance,
      fairness: {
        serverSeedId: serverSeed.id,
        serverSeedHash: serverSeed.hashedSeed,
        clientSeed: clientSeed.seed,
        nonce,
        hmac
      }
    });

  } catch (error) {
    console.error('Game play error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}