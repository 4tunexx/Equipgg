import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from '../../../../lib/auth-utils';
import { createServerSupabaseClient } from "../../../../lib/supabase";
import { trackBetPlaced, trackCrashGameEarnings } from '../../../../lib/mission-tracker';
import { checkBalanceAccess, createVerificationNotification } from "../../../../lib/verification-check";

// Game session management and play endpoint
export async function POST(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gameType, betAmount, gameData } = await request.json();

    if (!gameType || !betAmount) {
      return NextResponse.json({ 
        error: 'Game type and bet amount are required' 
      }, { status: 400 });
    }

    if (betAmount <= 0) {
      return NextResponse.json({ 
        error: 'Bet amount must be positive' 
      }, { status: 400 });
    }

    // Validate game type
    const validGameTypes = ['crash', 'coinflip', 'plinko', 'sweeper'];
    if (!validGameTypes.includes(gameType)) {
      return NextResponse.json({ 
        error: 'Invalid game type' 
      }, { status: 400 });
    }

    // Check verification status first - ANTI-CHEAT
    const verificationStatus = await checkBalanceAccess(session.user_id);
    if (!verificationStatus.canUseBalances) {
      // Create notification for user
      const notificationType = verificationStatus.requiresEmailVerification ? 'email' : 'steam';
      await createVerificationNotification(session.user_id, notificationType);
      
      return NextResponse.json({ 
        error: verificationStatus.message || 'Account verification required',
        requiresVerification: true,
        notificationCreated: true
      }, { status: 403 });
    }

    const supabase = createServerSupabaseClient();
    
    // Get user's current balance and XP data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('coins, level, vip_tier, xp')
      .eq('id', session.user_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (userData.coins < betAmount) {
      return NextResponse.json({ 
        error: 'Insufficient balance',
        required: betAmount,
        current: userData.coins
      }, { status: 400 });
    }

    // Generate game result based on game type
    let result: any = {};
    let winnings = 0;
    let won = false;

    switch (gameType) {
      case 'crash':
        // Crash game logic - use data from frontend
        let crashMultiplier;
        let targetMultiplier = gameData?.targetMultiplier;
        
        if (gameData?.crashedAt) {
          // Game crashed - use the actual crash point from frontend
          crashMultiplier = gameData.crashedAt;
          targetMultiplier = gameData.targetMultiplier || gameData.cashedOutAt || 2.0;
          // Player loses if they didn't cash out before crash
          won = gameData.cashedOutAt && gameData.cashedOutAt <= crashMultiplier;
          winnings = won ? Math.floor(betAmount * gameData.cashedOutAt) : 0;
        } else if (gameData?.cashedOutAt) {
          // Player cashed out successfully
          crashMultiplier = generateCrashMultiplier(); // This doesn't matter as they cashed out
          targetMultiplier = gameData.cashedOutAt;
          won = true;
          winnings = Math.floor(betAmount * gameData.cashedOutAt);
        } else {
          // Fallback to old logic if no specific data provided
          crashMultiplier = generateCrashMultiplier();
          targetMultiplier = gameData?.targetMultiplier || 2.0;
          won = crashMultiplier >= targetMultiplier;
          winnings = won ? Math.floor(betAmount * targetMultiplier) : 0;
        }
        
        result = {
          crashMultiplier,
          targetMultiplier,
          won,
          winnings,
          cashedOutAt: gameData?.cashedOutAt || null,
          crashedAt: gameData?.crashedAt || crashMultiplier
        };
        break;

      case 'coinflip':
        // 50/50 coinflip
        won = Math.random() < 0.5;
        winnings = won ? betAmount * 2 : 0;
        result = {
          choice: gameData?.choice || 'heads',
          result: won ? (gameData?.choice || 'heads') : (gameData?.choice === 'heads' ? 'tails' : 'heads'),
          won,
          winnings
        };
        break;

      case 'plinko':
        // Plinko ball drop simulation
        const plinkoMultipliers = [0.2, 0.5, 1.0, 1.5, 2.0, 5.0, 10.0, 2.0, 1.5, 1.0, 0.5, 0.2];
        const bucketIndex = Math.floor(Math.random() * plinkoMultipliers.length);
        const multiplier = plinkoMultipliers[bucketIndex];
        winnings = Math.floor(betAmount * multiplier);
        won = multiplier > 1.0;
        result = {
          bucketIndex,
          multiplier,
          won,
          winnings
        };
        break;

      case 'sweeper':
        // Mine sweeper style game
        const gridSize = gameData?.gridSize || 25;
        const mineCount = gameData?.mineCount || 5;
        const revealCount = gameData?.revealCount || 3;
        const safeReveals = Math.floor(Math.random() * (revealCount + 1));
        won = safeReveals === revealCount;
        const sweeperMultiplier = won ? (1 + (revealCount * 0.5)) : 0;
        winnings = won ? Math.floor(betAmount * sweeperMultiplier) : 0;
        result = {
          gridSize,
          mineCount,
          revealCount,
          safeReveals,
          won,
          winnings
        };
        break;
    }

    // Calculate new balance and XP
    const newBalance = userData.coins - betAmount + winnings;
    const netGain = winnings - betAmount;
    // Give balanced XP: minimum 1 XP, +1 XP per 100 coins bet (more balanced)
    const xpGain = Math.max(1, Math.floor(betAmount / 100));

    // Update user balance
    const { error: updateError } = await supabase
      .from('users')
      .update({ coins: newBalance })
      .eq('id', session.user_id);

    if (updateError) {
      console.error('Error updating user balance:', updateError);
      return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
    }

    // Record the game in game_history table
    const gameHistoryRecord = {
      id: `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: session.user_id,
      game_type: gameType,
      bet_amount: betAmount,
      winnings: winnings,
      profit: netGain,
      multiplier: result.multiplier || result.targetMultiplier || 1.0,
      game_data: JSON.stringify(result),
      result: won ? 'win' : 'loss',
      tiles_cleared: result.safeReveals || result.revealCount || 0,
      xp_gained: xpGain
    };

    // Insert into game_history table
    const { error: historyError } = await supabase
      .from('game_history')
      .insert([gameHistoryRecord]);

    if (historyError) {
      console.log('Game history insert error:', historyError);
      // Don't fail the request if history insert fails
    }

    // Record transaction
    await supabase.from('user_transactions').insert([{
      user_id: session.user_id,
      type: won ? 'game_win' : 'game_loss',
      amount: netGain,
      description: `${gameType} game - ${won ? 'Won' : 'Lost'} ${Math.abs(netGain)} coins`,
      created_at: new Date().toISOString()
    }]);

    // Update XP and level for playing
    const newXP = (userData.xp || 0) + xpGain;
    
    // Calculate correct level from new XP total
    const { getLevelFromXP } = await import('../../../../lib/xp-config');
    const calculatedLevel = getLevelFromXP(newXP);
    
    await supabase
      .from('users')
      .update({ 
        xp: newXP,
        level: calculatedLevel
      })
      .eq('id', session.user_id);

    // Track mission progress
    try {
      // Track bet placed for all games
      await trackBetPlaced(session.user_id, betAmount, gameType, supabase);
      
      // Track crash game specific earnings if won
      if (gameType === 'crash' && won && winnings > 0) {
        await trackCrashGameEarnings(session.user_id, winnings, supabase);
      }
    } catch (missionError) {
      console.error('Error tracking mission progress:', missionError);
      // Don't fail the game request if mission tracking fails
    }

    // Log activity to activity feed if won (non-blocking)
    if (won && winnings > 0) {
      try {
        await supabase
          .from('activity_feed')
          .insert({
            user_id: session.user_id,
            action: 'won_game',
            description: `won ${Math.floor(winnings)} coins on ${gameType}`,
            metadata: {
              amount: Math.floor(winnings),
              gameType: gameType,
              multiplier: result
            },
            created_at: new Date().toISOString()
          });
      } catch (activityError) {
        console.warn('Failed to log activity:', activityError);
      }
    }

    return NextResponse.json({
      success: true,
      game: {
        type: gameType,
        betAmount,
        result,
        won,
        winnings,
        netGain,
        newBalance,
        xpGain
      }
    });

  } catch (error) {
    console.error('Error in game play API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to generate crash multiplier
function generateCrashMultiplier(): number {
  // Simulate provably fair crash multiplier
  // This is a simplified version - real implementation would use cryptographic methods
  const random = Math.random();
  
  if (random < 0.33) {
    // 33% chance of low multiplier (1.0 - 2.0)
    return 1.0 + Math.random() * 1.0;
  } else if (random < 0.66) {
    // 33% chance of medium multiplier (2.0 - 5.0)
    return 2.0 + Math.random() * 3.0;
  } else if (random < 0.9) {
    // 24% chance of high multiplier (5.0 - 10.0)
    return 5.0 + Math.random() * 5.0;
  } else {
    // 10% chance of very high multiplier (10.0 - 100.0)
    return 10.0 + Math.random() * 90.0;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gameType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const supabase = createServerSupabaseClient();

    // Get user's recent games from game_history table
    const { data: recentGames, error } = await supabase
      .from('game_history')
      .select('*')
      .eq('user_id', session.user_id)
      .eq(gameType ? 'game_type' : 'user_id', gameType || session.user_id) // Filter by game type if provided
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching game history:', error);
      return NextResponse.json({ error: 'Failed to fetch game history' }, { status: 500 });
    }

    // If table doesn't exist, return empty array
    if (error && error.code === 'PGRST116') {
      return NextResponse.json({
        success: true,
        games: [],
        message: 'Game history not yet available'
      });
    }

    return NextResponse.json({
      success: true,
      games: recentGames || []
    });

  } catch (error) {
    console.error('Error in game history API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
