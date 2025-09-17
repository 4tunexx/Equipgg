import { Server } from 'socket.io';
import { AuthenticatedSocket, BetPlacedEvent, BetResultEvent, OddsUpdateEvent } from './types';
import { emitToAll, emitToUser, createEventData, isAdmin } from './utils';
import { getDb, getOne, run } from '@/lib/db';

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
        const db = await getDb();
        await run(
          'UPDATE users SET coins = coins - ? WHERE id = ?',
          [data.amount, socket.userId]
        );

        // Emit balance update to user
        const user = await getOne('SELECT coins, gems, xp, level FROM users WHERE id = ?', [socket.userId]);
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
          const db = await getDb();
          await run(
            'UPDATE users SET coins = coins + ? WHERE id = ?',
            [data.winnings, socket.userId]
          );
        }

        // Emit to user specifically
        emitToUser(io, socket.userId, 'bet-result', betEvent);

        // Emit balance update
        const user = await getOne('SELECT coins, gems, xp, level FROM users WHERE id = ?', [socket.userId]);
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
        const db = await getDb();
        await run(
          'UPDATE matches SET odds1 = ?, odds2 = ?, updated_at = ? WHERE id = ?',
          [data.team1Odds, data.team2Odds, new Date().toISOString(), data.matchId]
        );

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
        const db = await getDb();
        await run(
          'UPDATE matches SET status = ?, result = ?, updated_at = ? WHERE id = ?',
          [data.status, JSON.stringify(data.result), new Date().toISOString(), data.matchId]
        );

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

        const db = await getDb();
        const stats = await getOne(
          `SELECT 
            COUNT(*) as total_bets,
            SUM(amount) as total_amount,
            AVG(amount) as avg_amount,
            COUNT(CASE WHEN team_id = (SELECT team1 FROM matches WHERE id = ?) THEN 1 END) as team1_bets,
            COUNT(CASE WHEN team_id = (SELECT team2 FROM matches WHERE id = ?) THEN 1 END) as team2_bets
           FROM user_bets WHERE match_id = ?`,
          [data.matchId, data.matchId, data.matchId]
        );

        socket.emit('betting-stats', {
          matchId: data.matchId,
          stats,
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
