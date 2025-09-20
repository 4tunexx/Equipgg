
import { Server } from 'socket.io';
import { AuthenticatedSocket, XpGainedEvent, MissionProgressEvent } from './types';
import { emitToUser, emitToAll, createEventData } from './utils';
import { supabase } from '../lib/supabase';

export function setupXpSocket(io: Server) {
  return (socket: AuthenticatedSocket) => {
    console.log(`XP socket connected: ${socket.userId}`);

    // Join user to their personal room
    socket.join(`user-${socket.userId}`);

    // Handle XP gain
    socket.on('xp-gained', async (data: Omit<XpGainedEvent, 'timestamp' | 'userId'>) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const xpEvent = createEventData(socket.userId, data);

        // Emit to user specifically
        emitToUser(io, socket.userId, 'xp-gained', xpEvent);

        // If leveled up, emit special event
        if (data.leveledUp && data.newLevel) {
          emitToUser(io, socket.userId, 'level-up', {
            userId: socket.userId,
            newLevel: data.newLevel,
            levelsGained: data.levelsGained || 1,
            timestamp: new Date().toISOString()
          });

          // Emit to all users for leaderboard updates
          emitToAll(io, 'leaderboard-updated', {
            type: 'level',
            userId: socket.userId,
            username: socket.username || 'Anonymous',
            newValue: data.newLevel,
            timestamp: new Date().toISOString()
          });
        }

        // Update user balance using Supabase
        const { data: user, error } = await supabase
          .from('users')
          .select('coins, gems, xp, level')
          .eq('id', socket.userId)
          .single();
        if (error) {
          console.error('Supabase error fetching user balance:', error);
        } else if (user) {
          emitToUser(io, socket.userId, 'balance-updated', {
            userId: socket.userId,
            coins: user.coins,
            gems: user.gems,
            xp: user.xp,
            level: user.level,
            timestamp: new Date().toISOString()
          });
        }

        console.log(`XP gained: User ${socket.userId} gained ${data.amount} XP from ${data.source}`);
      } catch (error) {
        console.error('XP gain error:', error);
        socket.emit('error', { message: 'Failed to process XP gain' });
      }
    });

    // Handle mission progress
    socket.on('mission-progress', async (data: Omit<MissionProgressEvent, 'timestamp' | 'userId'>) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const missionEvent = createEventData(socket.userId, data);

        // Emit to user specifically
        emitToUser(io, socket.userId, 'mission-progress', missionEvent);

        // If mission completed, emit special event
        if (data.completed) {
          emitToUser(io, socket.userId, 'mission-completed', {
            userId: socket.userId,
            missionId: data.missionId,
            reward: data.reward,
            timestamp: new Date().toISOString()
          });
        }

        console.log(`Mission progress: User ${socket.userId} - ${data.missionId} (${data.progress}%)`);
      } catch (error) {
        console.error('Mission progress error:', error);
        socket.emit('error', { message: 'Failed to update mission progress' });
      }
    });

    // Handle daily bonus claim
    socket.on('daily-bonus-claimed', async (data: { bonusType: string; amount: number }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const bonusEvent = {
          userId: socket.userId,
          bonusType: data.bonusType,
          amount: data.amount,
          timestamp: new Date().toISOString()
        };

        // Emit to user
        emitToUser(io, socket.userId, 'daily-bonus-claimed', bonusEvent);

        // Update user balance using Supabase
        const { data: user, error } = await supabase
          .from('users')
          .select('coins, gems, xp, level')
          .eq('id', socket.userId)
          .single();
        if (error) {
          console.error('Supabase error fetching user balance:', error);
        } else if (user) {
          emitToUser(io, socket.userId, 'balance-updated', {
            userId: socket.userId,
            coins: user.coins,
            gems: user.gems,
            xp: user.xp,
            level: user.level,
            timestamp: new Date().toISOString()
          });
        }

        console.log(`Daily bonus claimed: User ${socket.userId} claimed ${data.amount} ${data.bonusType}`);
      } catch (error) {
        console.error('Daily bonus error:', error);
        socket.emit('error', { message: 'Failed to claim daily bonus' });
      }
    });

    // Handle streak updates
    socket.on('streak-updated', async (data: { streakType: string; count: number; bonus: number }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const streakEvent = {
          userId: socket.userId,
          streakType: data.streakType,
          count: data.count,
          bonus: data.bonus,
          timestamp: new Date().toISOString()
        };

        // Emit to user
        emitToUser(io, socket.userId, 'streak-updated', streakEvent);

        console.log(`Streak updated: User ${socket.userId} - ${data.streakType} streak: ${data.count}`);
      } catch (error) {
        console.error('Streak update error:', error);
        socket.emit('error', { message: 'Failed to update streak' });
      }
    });

    // Handle XP multiplier updates
    socket.on('xp-multiplier-updated', async (data: { multiplier: number; source: string; duration?: number }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const multiplierEvent = {
          userId: socket.userId,
          multiplier: data.multiplier,
          source: data.source,
          duration: data.duration,
          timestamp: new Date().toISOString()
        };

        // Emit to user
        emitToUser(io, socket.userId, 'xp-multiplier-updated', multiplierEvent);

        console.log(`XP multiplier updated: User ${socket.userId} - ${data.multiplier}x from ${data.source}`);
      } catch (error) {
        console.error('XP multiplier error:', error);
        socket.emit('error', { message: 'Failed to update XP multiplier' });
      }
    });

    // Handle prestige events
    socket.on('prestige-achieved', async (data: { prestigeLevel: number; rewards: any }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const prestigeEvent = {
          userId: socket.userId,
          prestigeLevel: data.prestigeLevel,
          rewards: data.rewards,
          timestamp: new Date().toISOString()
        };

        // Emit to user
        emitToUser(io, socket.userId, 'prestige-achieved', prestigeEvent);

        // Emit to all users for leaderboard updates
        emitToAll(io, 'leaderboard-updated', {
          type: 'prestige',
          userId: socket.userId,
          username: socket.username || 'Anonymous',
          newValue: data.prestigeLevel,
          timestamp: new Date().toISOString()
        });

        console.log(`Prestige achieved: User ${socket.userId} reached prestige level ${data.prestigeLevel}`);
      } catch (error) {
        console.error('Prestige error:', error);
        socket.emit('error', { message: 'Failed to process prestige' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`XP socket disconnected: ${socket.userId}`);
    });
  };
}
