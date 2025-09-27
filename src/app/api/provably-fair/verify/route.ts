import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from "../../../../lib/auth-utils";
import { getGameVerificationData, verifyGameResult } from "../../../../lib/provablyFair";

// Verify a specific game result
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const { gameId } = await request.json();

    if (!gameId) {
      return NextResponse.json({ error: 'Game ID is required' }, { status: 400 });
    }

    const verificationData = await getGameVerificationData(gameId);

    if (!verificationData) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Verify the result
    const isValid = await verifyGameResult(gameId, verificationData.serverSeedHash);

    return NextResponse.json({
      success: true,
      verification: {
        gameId: verificationData.gameId,
        serverSeedHash: verificationData.serverSeedHash,
        clientSeed: verificationData.clientSeed,
        nonce: verificationData.nonce,
        result: verificationData.result,
        isValid,
        hmac: require('crypto').createHmac('sha256', verificationData.serverSeedHash)
          .update(`${verificationData.clientSeed}:${verificationData.nonce}`)
          .digest('hex')
      }
    });

  } catch (error) {
    console.error('Game verification error:', error);
    return NextResponse.json({ error: 'Failed to verify game' }, { status: 500 });
  }
}

// Get user's game history for verification
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const { getUserGameHistory } = await import('../../../../lib/provablyFair');
    const gameHistory = await getUserGameHistory(session.user_id, limit);

    return NextResponse.json({
      success: true,
      gameHistory: gameHistory.map((game: any) => ({
        gameId: game.gameId,
        gameType: game.gameType,
        nonce: game.nonce,
        result: game.result,
        createdAt: game.createdAt
      }))
    });

  } catch (error) {
    console.error('Get game history error:', error);
    return NextResponse.json({ error: 'Failed to get game history' }, { status: 500 });
  }
}
