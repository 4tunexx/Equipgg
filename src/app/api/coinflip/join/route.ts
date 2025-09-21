import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from '../../../../lib/auth-utils';
import { supabase } from "../../../../lib/supabase";

// Join a coinflip game
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gameId, side } = await request.json();

    if (!gameId || !side) {
      return NextResponse.json({ 
        error: 'Game ID and side (heads/tails) are required' 
      }, { status: 400 });
    }

    if (!['heads', 'tails'].includes(side)) {
      return NextResponse.json({ 
        error: 'Side must be "heads" or "tails"' 
      }, { status: 400 });
    }

    // Get the coinflip game
    const { data: game, error: gameError } = await supabase
      .from('coinflip_games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (gameError) {
      if (gameError.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Coinflip system not available - tables not found',
          message: 'Game system in development'
        });
      }
      console.error('Error fetching coinflip game:', gameError);
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Check if game is available for joining
    if (game.status !== 'waiting') {
      return NextResponse.json({ 
        error: 'Game is not available for joining' 
      }, { status: 400 });
    }

    // Check if user is trying to join their own game
    if (game.creator_id === session.user_id) {
      return NextResponse.json({ 
        error: 'Cannot join your own game' 
      }, { status: 400 });
    }

    // Check if the chosen side is available
    if (game.creator_side === side) {
      return NextResponse.json({ 
        error: `Side "${side}" is already taken by the creator` 
      }, { status: 400 });
    }

    // Get user's current balance
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', session.user_id)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'User system not available',
          message: 'Game system in development'
        });
      }
      console.error('Error fetching user data:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has enough balance
    if (userData.balance < game.bet_amount) {
      return NextResponse.json({ 
        error: `Insufficient balance. Required: ${game.bet_amount}, Available: ${userData.balance}` 
      }, { status: 400 });
    }

    // Deduct bet amount from user's balance
    const newBalance = userData.balance - game.bet_amount;
    const { error: balanceError } = await supabase
      .from('users')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user_id);

    if (balanceError) {
      console.error('Error updating user balance:', balanceError);
      return NextResponse.json({ error: 'Failed to process bet' }, { status: 500 });
    }

    // Simulate coinflip result
    const flipResult = Math.random() < 0.5 ? 'heads' : 'tails';
    const isWinner = flipResult === side;
    const winnings = isWinner ? game.bet_amount * 2 : 0;

    // Update game with joiner and result
    const { data: updatedGame, error: updateError } = await supabase
      .from('coinflip_games')
      .update({
        joiner_id: session.user_id,
        joiner_side: side,
        result: flipResult,
        winner_id: isWinner ? session.user_id : game.creator_id,
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', gameId)
      .select()
      .single();

    if (updateError) {
      // Rollback balance change
      await supabase
        .from('users')
        .update({ balance: userData.balance })
        .eq('id', session.user_id);
      
      console.error('Error updating game:', updateError);
      return NextResponse.json({ error: 'Failed to update game' }, { status: 500 });
    }

    // Credit winnings to winner
    if (isWinner) {
      const { error: winningsError } = await supabase
        .from('users')
        .update({ 
          balance: newBalance + winnings,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user_id);

      if (winningsError) {
        console.error('Error crediting winnings:', winningsError);
      }
    } else {
      // Credit winnings to creator - get current balance first
      const { data: creatorData } = await supabase
        .from('users')
        .select('balance')
        .eq('id', game.creator_id)
        .single();

      if (creatorData) {
        const { error: winningsError } = await supabase
          .from('users')
          .update({ 
            balance: creatorData.balance + winnings,
            updated_at: new Date().toISOString()
          })
          .eq('id', game.creator_id);

        if (winningsError) {
          console.error('Error crediting winnings to creator:', winningsError);
        }
      }
    }

    // Record transactions
    const transactions = [
      {
        user_id: session.user_id,
        type: 'bet',
        amount: -game.bet_amount,
        description: `Coinflip bet - ${side}`,
        game_id: gameId,
        created_at: new Date().toISOString()
      }
    ];

    if (isWinner) {
      transactions.push({
        user_id: session.user_id,
        type: 'win',
        amount: winnings,
        description: `Coinflip win - ${flipResult}`,
        game_id: gameId,
        created_at: new Date().toISOString()
      });
    } else {
      transactions.push({
        user_id: game.creator_id,
        type: 'win',
        amount: winnings,
        description: `Coinflip win - ${flipResult}`,
        game_id: gameId,
        created_at: new Date().toISOString()
      });
    }

    const { error: transactionError } = await supabase
      .from('transactions')
      .insert(transactions);

    if (transactionError && transactionError.code !== 'PGRST116') {
      console.error('Error recording transactions:', transactionError);
    }

    // Award XP to both players
    const xpReward = 5; // 5 XP for playing
    
    // Get current XP for both players
    const { data: playersData } = await supabase
      .from('users')
      .select('id, xp')
      .in('id', [session.user_id, game.creator_id]);

    if (playersData) {
      for (const player of playersData) {
        await supabase
          .from('users')
          .update({ 
            xp: (player.xp || 0) + xpReward,
            updated_at: new Date().toISOString()
          })
          .eq('id', player.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: isWinner ? 'Congratulations! You won!' : 'Better luck next time!',
      game: {
        id: updatedGame.id,
        result: flipResult,
        yourSide: side,
        won: isWinner,
        winnings: isWinner ? winnings : 0,
        xpEarned: xpReward
      }
    });

  } catch (error) {
    console.error('Error joining coinflip game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
