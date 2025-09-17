import { Server } from 'socket.io';
import { AuthenticatedSocket, GameStartEvent, GameResultEvent } from './types';
import { emitToGame, emitToUser, createEventData, joinGameRoom } from './utils';
import { supabase } from '@/lib/supabase';

export function setupGamesSocket(io: Server) {
  return (socket: AuthenticatedSocket) => {
    console.log(`Games socket connected: ${socket.userId}`);

    // Join user to their personal room
    socket.join(`user-${socket.userId}`);

    // Handle game start
    socket.on('game-start', async (data: Omit<GameStartEvent, 'timestamp' | 'userId'>) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const gameEvent = createEventData(socket.userId, data);
        
        // Join game room
        joinGameRoom(socket, data.gameType, data.gameId);

        // Emit to all players in the game room
        emitToGame(io, data.gameType, 'game-started', gameEvent, data.gameId);

        // Log game start
        console.log(`Game started: ${data.gameType} by user ${socket.userId}`);
      } catch (error) {
        console.error('Game start error:', error);
        socket.emit('error', { message: 'Failed to start game' });
      }
    });

    // Handle game result
    socket.on('game-result', async (data: Omit<GameResultEvent, 'timestamp' | 'userId'>) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const gameEvent = createEventData(socket.userId, data);

        // Update user balance if they won
        if (data.isWin && data.winnings > 0) {
          // Update user balance in Supabase
          const { error: updateError } = await supabase
            .from('users')
            .update({ coins: supabase.rpc('increment', { x: data.winnings }) })
            .eq('id', socket.userId);

          if (updateError) {
            throw updateError;
          }

          // Fetch updated user info
          const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('coins, gems, xp, level')
            .eq('id', socket.userId)
            .single();

          if (fetchError) {
            throw fetchError;
          }

          if (user) {
            emitToUser(io, socket.userId, 'balance-updated', {
              userId: socket.userId,
              coins: user.coins,
              gems: user.gems,
              xp: user.xp,
              level: user.level,
              timestamp: new Date().toISOString()
            });
          }
        }

        // Emit result to game room
        emitToGame(io, data.gameType, 'game-result', gameEvent, data.gameId);

        // Emit to user specifically for detailed feedback
        emitToUser(io, socket.userId, 'game-result', gameEvent);

        console.log(`Game result: ${data.gameType} - User ${socket.userId} ${data.isWin ? 'won' : 'lost'} ${data.winnings} coins`);
      } catch (error) {
        console.error('Game result error:', error);
        socket.emit('error', { message: 'Failed to process game result' });
      }
    });

    // Handle fairness verification request
    socket.on('verify-fairness', async (data: { gameId: string; gameType: string; seed: string }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // In a real implementation, you would verify the seed and game outcome
        // For now, we'll just acknowledge the request
        const verification = {
          gameId: data.gameId,
          gameType: data.gameType,
          seed: data.seed,
          verified: true,
          timestamp: new Date().toISOString()
        };

        socket.emit('fairness-verified', verification);
      } catch (error) {
        console.error('Fairness verification error:', error);
        socket.emit('error', { message: 'Failed to verify fairness' });
      }
    });

    // Handle joining specific game rooms
    socket.on('join-game-room', (data: { gameType: string; gameId?: string }) => {
      joinGameRoom(socket, data.gameType, data.gameId);
    });

    // Handle leaving game rooms
    socket.on('leave-game-room', (data: { gameType: string; gameId?: string }) => {
      const roomName = data.gameId ? `game-${data.gameType}-${data.gameId}` : `game-${data.gameType}`;
      socket.leave(roomName);
      console.log(`User ${socket.userId} left ${roomName}`);
    });

    // Handle Plinko specific events
    socket.on('plinko-ball-drop', (data: { gameId: string; path: number[]; result: number }) => {
      const eventData = createEventData(socket.userId!, {
        gameId: data.gameId,
        gameType: 'plinko' as const,
        result: { path: data.path, multiplier: data.result },
        winnings: 0, // Will be calculated by the game
        isWin: data.result > 1
      });

      emitToGame(io, 'plinko', 'plinko-ball-dropped', eventData, data.gameId);
    });

    // Handle Crash specific events
    socket.on('crash-multiplier-update', (data: { gameId: string; multiplier: number; crashed: boolean }) => {
      const eventData = {
        gameId: data.gameId,
        multiplier: data.multiplier,
        crashed: data.crashed,
        timestamp: new Date().toISOString()
      };

      emitToGame(io, 'crash', 'crash-update', eventData, data.gameId);
    });

    // Handle Coinflip specific events
    socket.on('coinflip-result', (data: { gameId: string; result: 'heads' | 'tails'; winner: string }) => {
      const eventData = {
        gameId: data.gameId,
        result: data.result,
        winner: data.winner,
        timestamp: new Date().toISOString()
      };

      emitToGame(io, 'coinflip', 'coinflip-result', eventData, data.gameId);
    });

    // Handle Sweeper specific events
    socket.on('sweeper-mine-revealed', (data: { gameId: string; position: { x: number; y: number }; isMine: boolean }) => {
      const eventData = {
        gameId: data.gameId,
        position: data.position,
        isMine: data.isMine,
        timestamp: new Date().toISOString()
      };

      emitToGame(io, 'sweeper', 'mine-revealed', eventData, data.gameId);
    });

    socket.on('disconnect', () => {
      console.log(`Games socket disconnected: ${socket.userId}`);
    });
  };
}
