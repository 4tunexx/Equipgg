import { Server } from 'socket.io';
import { AuthenticatedSocket, AchievementUnlockedEvent } from './types';
import { emitToUser, emitToAll, createEventData } from './utils';
import { getDb, getOne, run } from '@/lib/db';

export function setupAchievementsSocket(io: Server) {
  return (socket: AuthenticatedSocket) => {
    console.log(`Achievements socket connected: ${socket.userId}`);

    // Join user to their personal room
    socket.join(`user-${socket.userId}`);

    // Handle achievement unlock
    socket.on('achievement-unlocked', async (data: Omit<AchievementUnlockedEvent, 'timestamp' | 'userId'>) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const achievementEvent = createEventData(socket.userId, data);

        // Emit to user specifically
        emitToUser(io, socket.userId, 'achievement-unlocked', achievementEvent);

        // Award XP if specified
        if (data.xpReward > 0) {
          const db = await getDb();
          await run(
            'UPDATE users SET xp = xp + ? WHERE id = ?',
            [data.xpReward, socket.userId]
          );

          // Emit XP gain event
          emitToUser(io, socket.userId, 'xp-gained', {
            userId: socket.userId,
            amount: data.xpReward,
            source: 'achievement',
            leveledUp: false,
            timestamp: new Date().toISOString()
          });
        }

        // Update user balance
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

        console.log(`Achievement unlocked: User ${socket.userId} unlocked "${data.title}"`);
      } catch (error) {
        console.error('Achievement unlock error:', error);
        socket.emit('error', { message: 'Failed to unlock achievement' });
      }
    });

    // Handle badge earned
    socket.on('badge-earned', async (data: { badgeId: string; badgeName: string; rarity: string; icon?: string }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const badgeEvent = {
          userId: socket.userId,
          badgeId: data.badgeId,
          badgeName: data.badgeName,
          rarity: data.rarity,
          icon: data.icon,
          timestamp: new Date().toISOString()
        };

        // Emit to user
        emitToUser(io, socket.userId, 'badge-earned', badgeEvent);

        // Emit to all users for rare badges
        if (data.rarity === 'legendary' || data.rarity === 'mythic') {
          emitToAll(io, 'rare-badge-earned', {
            ...badgeEvent,
            username: socket.username || 'Anonymous'
          });
        }

        console.log(`Badge earned: User ${socket.userId} earned "${data.badgeName}" (${data.rarity})`);
      } catch (error) {
        console.error('Badge earned error:', error);
        socket.emit('error', { message: 'Failed to process badge' });
      }
    });

    // Handle title unlocked
    socket.on('title-unlocked', async (data: { titleId: string; titleName: string; description: string }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const titleEvent = {
          userId: socket.userId,
          titleId: data.titleId,
          titleName: data.titleName,
          description: data.description,
          timestamp: new Date().toISOString()
        };

        // Emit to user
        emitToUser(io, socket.userId, 'title-unlocked', titleEvent);

        console.log(`Title unlocked: User ${socket.userId} unlocked "${data.titleName}"`);
      } catch (error) {
        console.error('Title unlock error:', error);
        socket.emit('error', { message: 'Failed to unlock title' });
      }
    });

    // Handle collection milestone
    socket.on('collection-milestone', async (data: { collectionType: string; milestone: number; reward: any }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const milestoneEvent = {
          userId: socket.userId,
          collectionType: data.collectionType,
          milestone: data.milestone,
          reward: data.reward,
          timestamp: new Date().toISOString()
        };

        // Emit to user
        emitToUser(io, socket.userId, 'collection-milestone', milestoneEvent);

        console.log(`Collection milestone: User ${socket.userId} reached ${data.milestone} ${data.collectionType}`);
      } catch (error) {
        console.error('Collection milestone error:', error);
        socket.emit('error', { message: 'Failed to process collection milestone' });
      }
    });

    // Handle streak achievement
    socket.on('streak-achievement', async (data: { streakType: string; days: number; achievement: string }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const streakEvent = {
          userId: socket.userId,
          streakType: data.streakType,
          days: data.days,
          achievement: data.achievement,
          timestamp: new Date().toISOString()
        };

        // Emit to user
        emitToUser(io, socket.userId, 'streak-achievement', streakEvent);

        // Emit to all users for impressive streaks
        if (data.days >= 30) {
          emitToAll(io, 'impressive-streak', {
            ...streakEvent,
            username: socket.username || 'Anonymous'
          });
        }

        console.log(`Streak achievement: User ${socket.userId} - ${data.days} day ${data.streakType} streak`);
      } catch (error) {
        console.error('Streak achievement error:', error);
        socket.emit('error', { message: 'Failed to process streak achievement' });
      }
    });

    // Handle special event achievement
    socket.on('special-event-achievement', async (data: { eventId: string; eventName: string; reward: any }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const eventAchievement = {
          userId: socket.userId,
          eventId: data.eventId,
          eventName: data.eventName,
          reward: data.reward,
          timestamp: new Date().toISOString()
        };

        // Emit to user
        emitToUser(io, socket.userId, 'special-event-achievement', eventAchievement);

        // Emit to all users for special events
        emitToAll(io, 'special-event-completed', {
          ...eventAchievement,
          username: socket.username || 'Anonymous'
        });

        console.log(`Special event achievement: User ${socket.userId} completed "${data.eventName}"`);
      } catch (error) {
        console.error('Special event achievement error:', error);
        socket.emit('error', { message: 'Failed to process special event achievement' });
      }
    });

    // Handle achievement progress update
    socket.on('achievement-progress', async (data: { achievementId: string; progress: number; maxProgress: number }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const progressEvent = {
          userId: socket.userId,
          achievementId: data.achievementId,
          progress: data.progress,
          maxProgress: data.maxProgress,
          percentage: Math.round((data.progress / data.maxProgress) * 100),
          timestamp: new Date().toISOString()
        };

        // Emit to user
        emitToUser(io, socket.userId, 'achievement-progress', progressEvent);

        console.log(`Achievement progress: User ${socket.userId} - ${data.achievementId} (${progressEvent.percentage}%)`);
      } catch (error) {
        console.error('Achievement progress error:', error);
        socket.emit('error', { message: 'Failed to update achievement progress' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Achievements socket disconnected: ${socket.userId}`);
    });
  };
}
