import { Server } from 'socket.io';
import { AuthenticatedSocket, LeaderboardUpdateEvent } from './types';
import { emitToAll, emitToUser } from './utils';
import { supabase } from '../lib/supabase';

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


        const limit = data.limit || 100;
        let rankings: any[] = [];
        if (data.type === 'coins') {
          const { data: users, error } = await supabase
            .from('users')
            .select('id, displayName, coins, level')
            .order('coins', { ascending: false })
            .limit(limit);
          if (error) throw error;
          rankings = users || [];
        } else if (data.type === 'xp') {
          const { data: users, error } = await supabase
            .from('users')
            .select('id, displayName, xp, level')
            .order('xp', { ascending: false })
            .limit(limit);
          if (error) throw error;
          rankings = users || [];
        } else if (data.type === 'level') {
          const { data: users, error } = await supabase
            .from('users')
            .select('id, displayName, level, xp')
            .order('level', { ascending: false })
            .order('xp', { ascending: false })
            .limit(limit);
          if (error) throw error;
          rankings = users || [];
        } else if (data.type === 'prestige') {
          const { data: users, error } = await supabase
            .from('users')
            .select('id, displayName, prestige_level, level')
            .gt('prestige_level', 0)
            .order('prestige_level', { ascending: false })
            .order('level', { ascending: false })
            .limit(limit);
          if (error) throw error;
          rankings = users || [];
        } else if (data.type === 'wins') {
          // For wins, you may need a Supabase function or view for aggregation, or fetch and aggregate in code
          // Placeholder: fetch users and set wins/total_bets to 0
          const { data: users, error } = await supabase
            .from('users')
            .select('id, displayName, level')
            .limit(limit);
          if (error) throw error;
          rankings = (users || []).map(u => ({ ...u, wins: 0, total_bets: 0 }));
        }

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

        let userValue = 0;
        let rank = 1;
        if (data.type === 'coins') {
          const { data: user, error } = await supabase
            .from('users')
            .select('coins')
            .eq('id', socket.userId)
            .single();
          if (error) throw error;
          userValue = user?.coins || 0;
          const { count } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .gt('coins', userValue);
          rank = (count || 0) + 1;
        } else if (data.type === 'xp') {
          const { data: user, error } = await supabase
            .from('users')
            .select('xp')
            .eq('id', socket.userId)
            .single();
          if (error) throw error;
          userValue = user?.xp || 0;
          const { count } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .gt('xp', userValue);
          rank = (count || 0) + 1;
        } else if (data.type === 'level') {
          const { data: user, error } = await supabase
            .from('users')
            .select('level, xp')
            .eq('id', socket.userId)
            .single();
          if (error) throw error;
          userValue = user?.level || 0;
          // For level, you may want to count users with higher level or same level but higher xp
          const { count } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .or(`level.gt.${userValue},and(level.eq.${userValue},xp.gt.${user?.xp || 0})`);
          rank = (count || 0) + 1;
        } else if (data.type === 'prestige') {
          const { data: user, error } = await supabase
            .from('users')
            .select('prestige_level')
            .eq('id', socket.userId)
            .single();
          if (error) throw error;
          userValue = user?.prestige_level || 0;
          const { count } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .gt('prestige_level', userValue);
          rank = (count || 0) + 1;
        } else if (data.type === 'wins') {
          // Placeholder: set userValue and rank to 0/1
          userValue = 0;
          rank = 1;
        }

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


        const limit = data.limit || 100;
        const daysBack = data.period === 'weekly' ? 7 : 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysBack);

        let rankings: any[] = [];
        if (data.type === 'coins') {
          // Placeholder: fetch users and set coins_gained to 0
          const { data: users, error } = await supabase
            .from('users')
            .select('id, displayName, level, coins')
            .order('coins', { ascending: false })
            .limit(limit);
          if (error) throw error;
          rankings = (users || []).map(u => ({ ...u, coins_gained: 0 }));
        } else if (data.type === 'xp') {
          const { data: users, error } = await supabase
            .from('users')
            .select('id, displayName, level, xp')
            .order('xp', { ascending: false })
            .limit(limit);
          if (error) throw error;
          rankings = (users || []).map(u => ({ ...u, xp_gained: 0 }));
        } else if (data.type === 'wins') {
          const { data: users, error } = await supabase
            .from('users')
            .select('id, displayName, level')
            .limit(limit);
          if (error) throw error;
          rankings = (users || []).map(u => ({ ...u, wins: 0 }));
        }

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
