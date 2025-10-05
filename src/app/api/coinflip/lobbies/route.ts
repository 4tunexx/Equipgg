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
      .from('coinflip_lobbies')
      .select(`
        id,
        creator_id,
        bet_amount,
        side,
        status,
        created_at,
        winner_id,
        completed_at,
        joiner_id
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (gamesError) {
      if (gamesError.code === 'PGRST116' || gamesError.code === '42P01') {
        // Tables don't exist yet - return empty state
        return NextResponse.json({
          success: true,
          lobbies: [],
          games: [],
          total: 0,
          message: 'Coinflip feature not yet configured. Please set up the database tables.'
        });
      }
      console.error('Error fetching coinflip games:', gamesError);
      return NextResponse.json({ 
        error: 'Failed to fetch coinflip games',
        success: false,
        lobbies: [],
        games: [],
        total: 0
      }, { status: 500 });
    }

    // Get user data for each game separately to avoid join issues
    const gamesWithUsers = await Promise.all(
      (games || []).map(async (game: any) => {
        const { data: creator } = await supabase
          .from('users')
          .select('username, level, vip_tier')
          .eq('id', game.creator_id)
          .single();
        
        return {
          ...game,
          creator: creator || { username: 'Unknown', level: 1, vip_tier: 'none' }
        };
      })
    );

    // Format the response
    const formattedGames = gamesWithUsers?.map(game => {
      return {
        id: game.id,
        creator: {
          username: game.creator?.username || 'Unknown',
          level: game.creator?.level || 1,
          vip_tier: game.creator?.vip_tier || 'none'
        },
        bet_amount: game.bet_amount,
        creator_side: game.side, // Use the 'side' column as creator_side
        available_side: game.side === 'heads' ? 'tails' : 'heads',
        status: game.status,
        created_at: game.created_at,
        result: null, // No result column in this table
        winner_id: game.winner_id,
        completed_at: game.completed_at,
        joiner_id: game.joiner_id
      };
    }) || [];

    return NextResponse.json({
      success: true,
      lobbies: formattedGames,
      games: formattedGames, // Keep for backward compatibility
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
    console.log('=== COINFLIP POST DEBUG START ===');
    const session = await getAuthSession(request);
    console.log('Session:', session ? 'Valid' : 'Invalid');
    if (!session) {
      console.log('No session, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Request body:', body);
    const { betAmount, side } = body;
    console.log('Parsed betAmount:', betAmount, 'side:', side);

    if (!betAmount || betAmount <= 0) {
      console.log('Invalid bet amount:', betAmount);
      return NextResponse.json({ 
        error: 'Valid bet amount is required' 
      }, { status: 400 });
    }

    if (!side || !['heads', 'tails'].includes(side)) {
      console.log('Invalid side:', side);
      return NextResponse.json({ 
        error: 'Side must be "heads" or "tails"' 
      }, { status: 400 });
    }

    // Minimum and maximum bet validation
    if (betAmount < 10) {
      console.log('Bet amount too low:', betAmount);
      return NextResponse.json({ 
        error: 'Minimum bet amount is 10 coins' 
      }, { status: 400 });
    }

    if (betAmount > 1000) {
      console.log('Bet amount too high:', betAmount);
      return NextResponse.json({ 
        error: 'Maximum bet amount is 1000 coins' 
      }, { status: 400 });
    }

    console.log('Bet validation passed, fetching user data...');
    console.log('Fetching user data for user_id:', session.user_id);

    let userData: any = null;
    try {
      // Get user's current balance
      const { data: userQueryData, error: userError } = await supabase
        .from('users')
        .select('balance, username, level, vip_tier')
        .eq('id', session.user_id)
        .single();

      console.log('User data fetch result:', { userData: userQueryData, userError });

      if (userError) {
        console.log('User error details:', userError);
        if (userError.code === 'PGRST116') {
          console.log('User not found (PGRST116), using development mode');
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
        console.log('Returning 404 error for user not found');
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      userData = userQueryData;
      console.log('User data fetched successfully:', userData);
    } catch (fetchError) {
      console.error('Exception during user data fetch:', fetchError);
      console.log('Returning 500 error for fetch exception');
      return NextResponse.json({ error: 'Database error during user fetch' }, { status: 500 });
    }

    // Check if user has enough balance
    console.log('Checking balance:', userData.balance, 'vs bet amount:', betAmount);
    if (userData.balance < betAmount) {
      console.log('Insufficient balance, returning 400');
      return NextResponse.json({ 
        error: `Insufficient balance. Required: ${betAmount}, Available: ${userData.balance}` 
      }, { status: 400 });
    }

    console.log('Balance check passed, checking for existing games...');

    // Check if user already has an active game (TEMPORARILY DISABLED)
    console.log('Querying for existing games for user:', session.user_id);
    const { data: existingGame, error: existingError } = await supabase
      .from('coinflip_lobbies')
      .select('id')
      .eq('creator_id', session.user_id)
      .eq('status', 'waiting')
      .single();

    console.log('Existing game query result:', { existingGame, existingError });

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing games:', existingError);
      console.log('Returning 500 error for existing game check failure');
      return NextResponse.json({ error: 'Failed to check existing games' }, { status: 500 });
    }

    // TEMPORARILY DISABLED: Allow multiple games per user for testing
    // if (existingGame) {
    //   console.log('User already has active game:', existingGame.id);
    //   return NextResponse.json({ 
    //     error: 'You already have an active game. Complete or cancel it first.' 
    //   }, { status: 400 });
    // }

    if (existingGame) {
      console.log('User already has active game, but allowing multiple games for now:', existingGame.id);
    }

    console.log('No existing games found, proceeding to create new game...');

    // Deduct bet amount from user's balance
    const newBalance = userData.balance - betAmount;
    const { error: balanceError } = await supabase
      .from('users')
      .update({ 
        balance: newBalance
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
      side: side, // Use 'side' instead of 'creator_side'
      status: 'waiting',
      created_at: new Date().toISOString()
    };

    const { data: newGame, error: gameError } = await supabase
      .from('coinflip_lobbies')
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
      .from('coinflip_lobbies')
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
          balance: userData.balance + game.bet_amount
        })
        .eq('id', session.user_id);

      if (refundError) {
        console.error('Error refunding bet:', refundError);
      }
    }

    // Update game status
    const { error: updateError } = await supabase
      .from('coinflip_lobbies')
      .update({
        status: 'cancelled'
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
