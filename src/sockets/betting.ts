import { Server } from 'socket.io';
import { AuthenticatedSocket, BetPlacedEvent, BetResultEvent, OddsUpdateEvent } from './types';
import { emitToAll, emitToUser, createEventData, isAdmin } from './utils';
import { supabase } from '@/lib/supabase';

export function setupBettingSocket(io: Server) {
  return (socket: AuthenticatedSocket) => {
    console.log(`Betting socket connected: ${socket.userId}`);

    // Join user to their personal room
    socket.join(`user-${socket.userId}`);

    // Handle bet placement
    socket.on('bet-placed', async (data: Omit<BetPlacedEvent, 'timestamp' | 'userId'>) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const betEvent = createEventData(socket.userId, data);

        // Emit to all users (public event)
        emitToAll(io, 'bet-placed', {
          ...betEvent,
          username: socket.username || 'Anonymous'
        });

        // Update user balance
        // Update user balance in Supabase
        const { error: updateError } = await supabase
          .from('users')
          .update({ coins: supabase.rpc('decrement', { x: data.amount }) })
          .eq('id', socket.userId);
        if (updateError) throw updateError;

        // Emit balance update to user
        const { data: user, error: fetchError } = await supabase
          .from('users')
          .select('coins, gems, xp, level')
          .eq('id', socket.userId)
          .single();
        if (fetchError) throw fetchError;
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

        console.log(`Bet placed: User ${socket.userId} bet ${data.amount} on match ${data.matchId}`);
      } catch (error) {
        console.error('Bet placement error:', error);
        socket.emit('error', { message: 'Failed to place bet' });
      }
    });

    // Handle bet result
    socket.on('bet-result', async (data: Omit<BetResultEvent, 'timestamp' | 'userId'>) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const betEvent = createEventData(socket.userId, data);

        // Update user balance if they won
        if (data.won && data.winnings > 0) {
          // Update user balance in Supabase
          const { error: updateError } = await supabase
            .from('users')
            .update({ coins: supabase.rpc('increment', { x: data.winnings }) })
            .eq('id', socket.userId);
          if (updateError) throw updateError;
        }

        // Emit to user specifically
        emitToUser(io, socket.userId, 'bet-result', betEvent);

        // Emit balance update
        const { data: user, error: fetchError } = await supabase
          .from('users')
          .select('coins, gems, xp, level')
          .eq('id', socket.userId)
          .single();
        if (fetchError) throw fetchError;
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

        console.log(`Bet result: User ${socket.userId} ${data.won ? 'won' : 'lost'} ${data.winnings} coins`);
      } catch (error) {
        console.error('Bet result error:', error);
        socket.emit('error', { message: 'Failed to process bet result' });
      }
    });

    // Handle odds updates (admin only)
    socket.on('odds-update', async (data: Omit<OddsUpdateEvent, 'timestamp'>) => {
      try {
        if (!socket.userId || !isAdmin(socket)) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        const oddsEvent = {
          ...data,
          timestamp: new Date().toISOString()
        };

        // Emit to all users
        emitToAll(io, 'odds-updated', oddsEvent);

        // Update database
        // Update odds in Supabase
        const { error: oddsError } = await supabase
          .from('matches')
          .update({ odds1: data.team1Odds, odds2: data.team2Odds, updated_at: new Date().toISOString() })
          .eq('id', data.matchId);
        if (oddsError) throw oddsError;

        console.log(`Odds updated for match ${data.matchId} by admin ${socket.userId}`);
      } catch (error) {
        console.error('Odds update error:', error);
        socket.emit('error', { message: 'Failed to update odds' });
      }
    });

    // Handle match status updates
    socket.on('match-status-update', async (data: { matchId: string; status: string; result?: any }) => {
      try {
        if (!socket.userId || !isAdmin(socket)) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        const statusEvent = {
          matchId: data.matchId,
          status: data.status,
          result: data.result,
          timestamp: new Date().toISOString()
        };

        // Emit to all users
        emitToAll(io, 'match-status-updated', statusEvent);

        // Update database
        // Update match status in Supabase
        const { error: statusError } = await supabase
          .from('matches')
          .update({ status: data.status, result: JSON.stringify(data.result), updated_at: new Date().toISOString() })
          .eq('id', data.matchId);
        if (statusError) throw statusError;

        console.log(`Match status updated for ${data.matchId} by admin ${socket.userId}`);
      } catch (error) {
        console.error('Match status update error:', error);
        socket.emit('error', { message: 'Failed to update match status' });
      }
    });

    // Handle live betting updates
    socket.on('join-match-room', (data: { matchId: string }) => {
      socket.join(`match-${data.matchId}`);
      console.log(`User ${socket.userId} joined match room ${data.matchId}`);
    });

    socket.on('leave-match-room', (data: { matchId: string }) => {
      socket.leave(`match-${data.matchId}`);
      console.log(`User ${socket.userId} left match room ${data.matchId}`);
    });

    // Handle betting statistics
    socket.on('get-betting-stats', async (data: { matchId: string }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Fetch betting stats from Supabase (aggregate in code)
        const { data: bets, error: betsError } = await supabase
          .from('user_bets')
          .select('amount, team_id')
          .eq('match_id', data.matchId);
        if (betsError) throw betsError;
        // Fetch match info for team ids
        const { data: match, error: matchError } = await supabase
          .from('matches')
          .select('team1, team2')
          .eq('id', data.matchId)
          .single();
        if (matchError) throw matchError;
        const total_bets = bets?.length || 0;
        const total_amount = bets?.reduce((sum, b) => sum + (b.amount || 0), 0) || 0;
        const avg_amount = total_bets > 0 ? total_amount / total_bets : 0;
        const team1_bets = bets?.filter(b => b.team_id === match?.team1).length || 0;
        const team2_bets = bets?.filter(b => b.team_id === match?.team2).length || 0;
        socket.emit('betting-stats', {
          matchId: data.matchId,
          stats: {
            total_bets,
            total_amount,
            avg_amount,
            team1_bets,
            team2_bets
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Betting stats error:', error);
        socket.emit('error', { message: 'Failed to get betting stats' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Betting socket disconnected: ${socket.userId}`);
    });
  };
}
