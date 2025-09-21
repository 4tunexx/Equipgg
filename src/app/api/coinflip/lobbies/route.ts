import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from '../../../../lib/auth-utils';
import { supabase } from "../../../../lib/supabase";

// Get coinflip game lobbies
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'waiting';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get coinflip games
    const { data: games, error: gamesError } = await supabase
      .from('coinflip_games')
      .select(`
        id,
        creator_id,
        bet_amount,
        creator_side,
        status,
        created_at,
        result,
        winner_id,
        completed_at,
        users!creator_id (
          username,
          level,
          vip_tier
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (gamesError) {
      if (gamesError.code === 'PGRST116') {
        // Return mock data when tables don't exist
        const mockGames = [
          {
            id: 'cf_mock_1',
            creator: { username: 'Player1', level: 25, vip_tier: 'bronze' },
            bet_amount: 100,
            creator_side: 'heads',
            available_side: 'tails',
            status: 'waiting',
            created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
          },
          {
            id: 'cf_mock_2',
            creator: { username: 'ProGamer', level: 50, vip_tier: 'gold' },
            bet_amount: 250,
            creator_side: 'tails',
            available_side: 'heads',
            status: 'waiting',
            created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString()
          },
          {
            id: 'cf_mock_3',
            creator: { username: 'HighRoller', level: 75, vip_tier: 'platinum' },
            bet_amount: 500,
            creator_side: 'heads',
            available_side: 'tails',
            status: 'waiting',
            created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
          }
        ];

        return NextResponse.json({
          success: true,
          games: status === 'waiting' ? mockGames : [],
          total: status === 'waiting' ? mockGames.length : 0,
          message: 'Coinflip system in development - using mock data'
        });
      }
      console.error('Error fetching coinflip games:', gamesError);
      return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
    }

    // Format the response
    const formattedGames = games?.map(game => {
      const creator = Array.isArray(game.users) ? game.users[0] : game.users;
      return {
        id: game.id,
        creator: {
          username: creator?.username || 'Unknown',
          level: creator?.level || 1,
          vip_tier: creator?.vip_tier || 'none'
        },
        bet_amount: game.bet_amount,
        creator_side: game.creator_side,
        available_side: game.creator_side === 'heads' ? 'tails' : 'heads',
        status: game.status,
        created_at: game.created_at,
        result: game.result,
        winner_id: game.winner_id,
        completed_at: game.completed_at
      };
    }) || [];

    return NextResponse.json({
      success: true,
      games: formattedGames,
      total: formattedGames.length
    });

  } catch (error) {
    console.error('Error fetching coinflip lobbies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new coinflip game
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { betAmount, side } = await request.json();

    if (!betAmount || betAmount <= 0) {
      return NextResponse.json({ 
        error: 'Valid bet amount is required' 
      }, { status: 400 });
    }

    if (!side || !['heads', 'tails'].includes(side)) {
      return NextResponse.json({ 
        error: 'Side must be "heads" or "tails"' 
      }, { status: 400 });
    }

    // Minimum and maximum bet validation
    if (betAmount < 10) {
      return NextResponse.json({ 
        error: 'Minimum bet amount is 10 coins' 
      }, { status: 400 });
    }

    if (betAmount > 1000) {
      return NextResponse.json({ 
        error: 'Maximum bet amount is 1000 coins' 
      }, { status: 400 });
    }

    // Get user's current balance
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('balance, username, level, vip_tier')
      .eq('id', session.user_id)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          message: 'Game created (development mode)',
          game: {
            id: `cf_mock_${Date.now()}`,
            creator: { username: 'TestUser', level: 25, vip_tier: 'none' },
            bet_amount: betAmount,
            creator_side: side,
            status: 'waiting'
          }
        });
      }
      console.error('Error fetching user data:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has enough balance
    if (userData.balance < betAmount) {
      return NextResponse.json({ 
        error: `Insufficient balance. Required: ${betAmount}, Available: ${userData.balance}` 
      }, { status: 400 });
    }

    // Check if user already has an active game
    const { data: existingGame, error: existingError } = await supabase
      .from('coinflip_games')
      .select('id')
      .eq('creator_id', session.user_id)
      .eq('status', 'waiting')
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing games:', existingError);
    }

    if (existingGame) {
      return NextResponse.json({ 
        error: 'You already have an active game. Complete or cancel it first.' 
      }, { status: 400 });
    }

    // Deduct bet amount from user's balance
    const newBalance = userData.balance - betAmount;
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

    // Create the coinflip game
    const gameData = {
      id: `cf_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      creator_id: session.user_id,
      bet_amount: betAmount,
      creator_side: side,
      status: 'waiting',
      created_at: new Date().toISOString()
    };

    const { data: newGame, error: gameError } = await supabase
      .from('coinflip_games')
      .insert([gameData])
      .select()
      .single();

    if (gameError) {
      // Rollback balance change
      await supabase
        .from('users')
        .update({ balance: userData.balance })
        .eq('id', session.user_id);
      
      console.error('Error creating coinflip game:', gameError);
      return NextResponse.json({ error: 'Failed to create game' }, { status: 500 });
    }

    // Record the bet transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert([{
        user_id: session.user_id,
        type: 'bet',
        amount: -betAmount,
        description: `Coinflip game created - ${side}`,
        game_id: newGame.id,
        created_at: new Date().toISOString()
      }]);

    if (transactionError && transactionError.code !== 'PGRST116') {
      console.error('Error recording bet transaction:', transactionError);
    }

    return NextResponse.json({
      success: true,
      message: 'Coinflip game created successfully',
      game: {
        id: newGame.id,
        creator: {
          username: userData.username,
          level: userData.level,
          vip_tier: userData.vip_tier
        },
        bet_amount: betAmount,
        creator_side: side,
        available_side: side === 'heads' ? 'tails' : 'heads',
        status: 'waiting',
        created_at: newGame.created_at
      }
    });

  } catch (error) {
    console.error('Error creating coinflip game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Cancel a coinflip game (creator only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');

    if (!gameId) {
      return NextResponse.json({ 
        error: 'Game ID is required' 
      }, { status: 400 });
    }

    // Get the game
    const { data: game, error: gameError } = await supabase
      .from('coinflip_games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (gameError) {
      if (gameError.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          message: 'Game cancelled (development mode)'
        });
      }
      console.error('Error fetching game:', gameError);
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Check if user is the creator
    if (game.creator_id !== session.user_id) {
      return NextResponse.json({ 
        error: 'Only the game creator can cancel the game' 
      }, { status: 403 });
    }

    // Check if game can be cancelled
    if (game.status !== 'waiting') {
      return NextResponse.json({ 
        error: 'Only waiting games can be cancelled' 
      }, { status: 400 });
    }

    // Refund the bet amount
    const { data: userData } = await supabase
      .from('users')
      .select('balance')
      .eq('id', session.user_id)
      .single();

    if (userData) {
      const { error: refundError } = await supabase
        .from('users')
        .update({ 
          balance: userData.balance + game.bet_amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user_id);

      if (refundError) {
        console.error('Error refunding bet:', refundError);
      }
    }

    // Update game status
    const { error: updateError } = await supabase
      .from('coinflip_games')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', gameId);

    if (updateError) {
      console.error('Error cancelling game:', updateError);
      return NextResponse.json({ error: 'Failed to cancel game' }, { status: 500 });
    }

    // Record refund transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert([{
        user_id: session.user_id,
        type: 'refund',
        amount: game.bet_amount,
        description: 'Coinflip game cancelled - refund',
        game_id: gameId,
        created_at: new Date().toISOString()
      }]);

    if (transactionError && transactionError.code !== 'PGRST116') {
      console.error('Error recording refund transaction:', transactionError);
    }

    return NextResponse.json({
      success: true,
      message: 'Game cancelled and bet refunded'
    });

  } catch (error) {
    console.error('Error cancelling coinflip game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
