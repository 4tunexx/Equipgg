import { Server } from 'socket.io';
import { AuthenticatedSocket, LeaderboardUpdateEvent } from './types';
import { emitToAll, emitToUser } from './utils';
import { getDb, getAll } from '@/lib/db';

export function setupLeaderboardsSocket(io: Server) {
  return (socket: AuthenticatedSocket) => {
    console.log(`Leaderboards socket connected: ${socket.userId}`);

    // Join user to their personal room
    socket.join(`user-${socket.userId}`);

    // Handle leaderboard update request
    socket.on('get-leaderboard', async (data: { type: 'coins' | 'xp' | 'wins' | 'level' | 'prestige'; limit?: number }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const db = await getDb();
        const limit = data.limit || 100;
        let query = '';
        let params: any[] = [];

        switch (data.type) {
          case 'coins':
            query = 'SELECT id, displayName, coins, level FROM users ORDER BY coins DESC LIMIT ?';
            params = [limit];
            break;
          case 'xp':
            query = 'SELECT id, displayName, xp, level FROM users ORDER BY xp DESC LIMIT ?';
            params = [limit];
            break;
          case 'level':
            query = 'SELECT id, displayName, level, xp FROM users ORDER BY level DESC, xp DESC LIMIT ?';
            params = [limit];
            break;
          case 'wins':
            query = `
              SELECT u.id, u.displayName, u.level, 
                     COUNT(CASE WHEN ub.status = 'won' THEN 1 END) as wins,
                     COUNT(ub.id) as total_bets
              FROM users u
              LEFT JOIN user_bets ub ON u.id = ub.user_id
              GROUP BY u.id
              ORDER BY wins DESC, total_bets DESC
              LIMIT ?
            `;
            params = [limit];
            break;
          case 'prestige':
            query = 'SELECT id, displayName, prestige_level, level FROM users WHERE prestige_level > 0 ORDER BY prestige_level DESC, level DESC LIMIT ?';
            params = [limit];
            break;
        }

        const rankings = await getAll(query, params);
        const formattedRankings = rankings.map((user: any, index: number) => ({
          userId: user.id,
          username: user.displayName,
          value: user[data.type] || user.wins || user.prestige_level || 0,
          rank: index + 1,
          level: user.level || 0,
          additionalData: data.type === 'wins' ? { totalBets: user.total_bets } : undefined
        }));

        const leaderboardEvent: LeaderboardUpdateEvent = {
          type: data.type,
          rankings: formattedRankings,
          timestamp: new Date().toISOString()
        };

        socket.emit('leaderboard-updated', leaderboardEvent);

        console.log(`Leaderboard requested: User ${socket.userId} - ${data.type} (${formattedRankings.length} entries)`);
      } catch (error) {
        console.error('Leaderboard error:', error);
        socket.emit('error', { message: 'Failed to get leaderboard' });
      }
    });

    // Handle user rank request
    socket.on('get-user-rank', async (data: { type: 'coins' | 'xp' | 'wins' | 'level' | 'prestige' }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const db = await getDb();
        let query = '';
        let userValue = 0;

        switch (data.type) {
          case 'coins':
            query = 'SELECT coins FROM users WHERE id = ?';
            const coinsResult = await db.findOne('users', { id: socket.userId });
            userValue = coinsResult?.coins || 0;
            query = 'SELECT COUNT(*) + 1 as rank FROM users WHERE coins > ?';
            break;
          case 'xp':
            query = 'SELECT xp FROM users WHERE id = ?';
            const xpResult = await db.findOne('users', { id: socket.userId });
            userValue = xpResult?.xp || 0;
            query = 'SELECT COUNT(*) + 1 as rank FROM users WHERE xp > ?';
            break;
          case 'level':
            query = 'SELECT level, xp FROM users WHERE id = ?';
            const levelResult = await db.findOne('users', { id: socket.userId });
            userValue = levelResult?.level || 0;
            query = 'SELECT COUNT(*) + 1 as rank FROM users WHERE level > ? OR (level = ? AND xp > ?)';
            break;
          case 'wins':
            query = `
              SELECT COUNT(CASE WHEN status = 'won' THEN 1 END) as wins
              FROM user_bets WHERE user_id = ?
            `;
            const winsResult = await db.findOne('users', { id: socket.userId });
            userValue = winsResult?.wins || 0;
            query = `
              SELECT COUNT(*) + 1 as rank FROM (
                SELECT COUNT(CASE WHEN status = 'won' THEN 1 END) as wins
                FROM user_bets
                GROUP BY user_id
                HAVING wins > ?
              )
            `;
            break;
          case 'prestige':
            query = 'SELECT prestige_level FROM users WHERE id = ?';
            const prestigeResult = await db.findOne('users', { id: socket.userId });
            userValue = prestigeResult?.prestige_level || 0;
            query = 'SELECT COUNT(*) + 1 as rank FROM users WHERE prestige_level > ?';
            break;
        }

        const rankResult = await db.findOne('users', { id: socket.userId });
        const rank = rankResult?.rank || 1;

        socket.emit('user-rank', {
          userId: socket.userId,
          type: data.type,
          rank,
          value: userValue,
          timestamp: new Date().toISOString()
        });

        console.log(`User rank requested: User ${socket.userId} - ${data.type} rank ${rank}`);
      } catch (error) {
        console.error('User rank error:', error);
        socket.emit('error', { message: 'Failed to get user rank' });
      }
    });

    // Handle leaderboard subscription
    socket.on('subscribe-leaderboard', (data: { type: 'coins' | 'xp' | 'wins' | 'level' | 'prestige' }) => {
      socket.join(`leaderboard-${data.type}`);
      console.log(`User ${socket.userId} subscribed to ${data.type} leaderboard`);
    });

    // Handle leaderboard unsubscription
    socket.on('unsubscribe-leaderboard', (data: { type: 'coins' | 'xp' | 'wins' | 'level' | 'prestige' }) => {
      socket.leave(`leaderboard-${data.type}`);
      console.log(`User ${socket.userId} unsubscribed from ${data.type} leaderboard`);
    });

    // Handle weekly/monthly leaderboard request
    socket.on('get-periodic-leaderboard', async (data: { 
      type: 'coins' | 'xp' | 'wins'; 
      period: 'weekly' | 'monthly';
      limit?: number 
    }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const db = await getDb();
        const limit = data.limit || 100;
        const daysBack = data.period === 'weekly' ? 7 : 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysBack);

        let query = '';
        let params: any[] = [];

        switch (data.type) {
          case 'coins':
            query = `
              SELECT u.id, u.displayName, u.level,
                     (u.coins - COALESCE(prev.coins, 0)) as coins_gained
              FROM users u
              LEFT JOIN user_coin_history prev ON u.id = prev.user_id 
                AND prev.date = ?
              WHERE u.coins > COALESCE(prev.coins, 0)
              ORDER BY coins_gained DESC
              LIMIT ?
            `;
            params = [startDate.toISOString().split('T')[0], limit];
            break;
          case 'xp':
            query = `
              SELECT u.id, u.displayName, u.level,
                     (u.xp - COALESCE(prev.xp, 0)) as xp_gained
              FROM users u
              LEFT JOIN user_xp_history prev ON u.id = prev.user_id 
                AND prev.date = ?
              WHERE u.xp > COALESCE(prev.xp, 0)
              ORDER BY xp_gained DESC
              LIMIT ?
            `;
            params = [startDate.toISOString().split('T')[0], limit];
            break;
          case 'wins':
            query = `
              SELECT u.id, u.displayName, u.level,
                     COUNT(CASE WHEN ub.status = 'won' AND ub.created_at >= ? THEN 1 END) as wins
              FROM users u
              LEFT JOIN user_bets ub ON u.id = ub.user_id
              GROUP BY u.id
              HAVING wins > 0
              ORDER BY wins DESC
              LIMIT ?
            `;
            params = [startDate.toISOString(), limit];
            break;
        }

        const rankings = await getAll(query, params);
        const formattedRankings = rankings.map((user: any, index: number) => ({
          userId: user.id,
          username: user.displayName,
          value: user[`${data.type}_gained`] || user.wins || 0,
          rank: index + 1,
          level: user.level || 0
        }));

        const leaderboardEvent: LeaderboardUpdateEvent = {
          type: data.type,
          rankings: formattedRankings,
          timestamp: new Date().toISOString()
        };

        socket.emit('periodic-leaderboard-updated', {
          ...leaderboardEvent,
          period: data.period
        });

        console.log(`Periodic leaderboard requested: User ${socket.userId} - ${data.period} ${data.type}`);
      } catch (error) {
        console.error('Periodic leaderboard error:', error);
        socket.emit('error', { message: 'Failed to get periodic leaderboard' });
      }
    });

    // Handle leaderboard position change notification
    socket.on('leaderboard-position-changed', async (data: { 
      type: 'coins' | 'xp' | 'wins' | 'level' | 'prestige';
      oldRank: number;
      newRank: number;
      value: number;
    }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const positionEvent = {
          userId: socket.userId,
          type: data.type,
          oldRank: data.oldRank,
          newRank: data.newRank,
          value: data.value,
          improved: data.newRank < data.oldRank,
          timestamp: new Date().toISOString()
        };

        // Emit to user
        emitToUser(io, socket.userId, 'leaderboard-position-changed', positionEvent);

        // Emit to leaderboard subscribers
        io.to(`leaderboard-${data.type}`).emit('leaderboard-position-changed', {
          ...positionEvent,
          username: socket.username || 'Anonymous'
        });

        console.log(`Leaderboard position changed: User ${socket.userId} - ${data.type} rank ${data.oldRank} → ${data.newRank}`);
      } catch (error) {
        console.error('Leaderboard position change error:', error);
        socket.emit('error', { message: 'Failed to process position change' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Leaderboards socket disconnected: ${socket.userId}`);
    });
  };
}
