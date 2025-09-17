import { Server } from 'socket.io';
import { AuthenticatedSocket, AdminBroadcastEvent, ModerationActionEvent } from './types';
import { emitToAll, emitToAdmins, emitToUser, isAdmin, canModerate } from './utils';
import { getDb, getOne, run } from '@/lib/db';

export function setupAdminSocket(io: Server) {
  return (socket: AuthenticatedSocket) => {
    console.log(`Admin socket connected: ${socket.userId}`);

    // Join admin room if user is admin/moderator
    if (isAdmin(socket)) {
      socket.join('admin-room');
      console.log(`Admin ${socket.userId} joined admin room`);
    }

    if (canModerate(socket)) {
      socket.join('moderator-room');
      console.log(`Moderator ${socket.userId} joined moderator room`);
    }

    // Handle admin broadcasts
    socket.on('admin-broadcast', async (data: Omit<AdminBroadcastEvent, 'timestamp'>) => {
      try {
        if (!socket.userId || !isAdmin(socket)) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        const broadcastEvent: AdminBroadcastEvent = {
          ...data,
          timestamp: new Date().toISOString()
        };

        // Emit to all users
        emitToAll(io, 'admin-broadcast', broadcastEvent);

        // Log the broadcast
        const db = await getDb();
        await run(
          `INSERT INTO admin_logs (id, admin_id, action, details, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [
            `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            socket.userId,
            'broadcast',
            JSON.stringify(broadcastEvent),
            new Date().toISOString()
          ]
        );

        console.log(`Admin broadcast: ${socket.userId} - ${data.type}: ${data.message}`);
      } catch (error) {
        console.error('Admin broadcast error:', error);
        socket.emit('error', { message: 'Failed to send broadcast' });
      }
    });

    // Handle odds overrides
    socket.on('override-odds', async (data: { matchId: string; team1Odds: number; team2Odds: number; reason: string }) => {
      try {
        if (!socket.userId || !isAdmin(socket)) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        const db = await getDb();
        
        // Update odds in database
        await run(
          'UPDATE matches SET odds1 = ?, odds2 = ?, updated_at = ? WHERE id = ?',
          [data.team1Odds, data.team2Odds, new Date().toISOString(), data.matchId]
        );

        // Log the override
        await run(
          `INSERT INTO admin_logs (id, admin_id, action, details, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [
            `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            socket.userId,
            'odds_override',
            JSON.stringify({ matchId: data.matchId, team1Odds: data.team1Odds, team2Odds: data.team2Odds, reason: data.reason }),
            new Date().toISOString()
          ]
        );

        // Emit to all users
        emitToAll(io, 'odds-override', {
          matchId: data.matchId,
          team1Odds: data.team1Odds,
          team2Odds: data.team2Odds,
          reason: data.reason,
          adminId: socket.userId,
          adminName: socket.username || 'Admin',
          timestamp: new Date().toISOString()
        });

        console.log(`Odds override: ${socket.userId} updated odds for match ${data.matchId}`);
      } catch (error) {
        console.error('Odds override error:', error);
        socket.emit('error', { message: 'Failed to override odds' });
      }
    });

    // Handle user bans
    socket.on('ban-user', async (data: { targetUserId: string; reason: string; duration?: number }) => {
      try {
        if (!socket.userId || !canModerate(socket)) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        const db = await getDb();
        const banId = `ban_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create ban record
        await run(
          `INSERT INTO user_bans (id, user_id, banned_by, reason, expires_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            banId,
            data.targetUserId,
            socket.userId,
            data.reason,
            data.duration ? new Date(Date.now() + data.duration * 1000).toISOString() : null,
            new Date().toISOString()
          ]
        );

        // Update user status
        await run(
          'UPDATE users SET status = ?, banned_at = ? WHERE id = ?',
          ['banned', new Date().toISOString(), data.targetUserId]
        );

        const banEvent: ModerationActionEvent = {
          userId: socket.userId,
          targetUserId: data.targetUserId,
          action: 'ban',
          reason: data.reason,
          duration: data.duration,
          timestamp: new Date().toISOString()
        };

        // Emit to target user
        emitToUser(io, data.targetUserId, 'user-banned', {
          ...banEvent,
          moderatorName: socket.username || 'Moderator'
        });

        // Emit to moderators
        emitToAdmins(io, 'user-banned', {
          ...banEvent,
          moderatorName: socket.username || 'Moderator'
        });

        console.log(`User banned: ${socket.userId} banned ${data.targetUserId} - ${data.reason}`);
      } catch (error) {
        console.error('Ban user error:', error);
        socket.emit('error', { message: 'Failed to ban user' });
      }
    });

    // Handle user mutes
    socket.on('mute-user', async (data: { targetUserId: string; reason: string; duration: number }) => {
      try {
        if (!socket.userId || !canModerate(socket)) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        const db = await getDb();
        const muteId = `mute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create mute record
        await run(
          `INSERT INTO user_mutes (id, user_id, muted_by, reason, expires_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            muteId,
            data.targetUserId,
            socket.userId,
            data.reason,
            new Date(Date.now() + data.duration * 1000).toISOString(),
            new Date().toISOString()
          ]
        );

        const muteEvent: ModerationActionEvent = {
          userId: socket.userId,
          targetUserId: data.targetUserId,
          action: 'mute',
          reason: data.reason,
          duration: data.duration,
          timestamp: new Date().toISOString()
        };

        // Emit to target user
        emitToUser(io, data.targetUserId, 'user-muted', {
          ...muteEvent,
          moderatorName: socket.username || 'Moderator'
        });

        // Emit to moderators
        emitToAdmins(io, 'user-muted', {
          ...muteEvent,
          moderatorName: socket.username || 'Moderator'
        });

        console.log(`User muted: ${socket.userId} muted ${data.targetUserId} for ${data.duration}s - ${data.reason}`);
      } catch (error) {
        console.error('Mute user error:', error);
        socket.emit('error', { message: 'Failed to mute user' });
      }
    });

    // Handle site maintenance mode
    socket.on('toggle-maintenance', async (data: { enabled: boolean; message?: string }) => {
      try {
        if (!socket.userId || !isAdmin(socket)) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        const db = await getDb();
        
        // Update maintenance mode
        await run(
          'UPDATE site_settings SET value = ?, updated_at = ? WHERE key = ?',
          [data.enabled ? 'true' : 'false', new Date().toISOString(), 'maintenance_mode']
        );

        if (data.message) {
          await run(
            'UPDATE site_settings SET value = ?, updated_at = ? WHERE key = ?',
            [data.message, new Date().toISOString(), 'maintenance_message']
          );
        }

        // Emit to all users
        emitToAll(io, 'maintenance-mode', {
          enabled: data.enabled,
          message: data.message || 'Site is under maintenance. Please try again later.',
          timestamp: new Date().toISOString()
        });

        console.log(`Maintenance mode ${data.enabled ? 'enabled' : 'disabled'} by ${socket.userId}`);
      } catch (error) {
        console.error('Maintenance mode error:', error);
        socket.emit('error', { message: 'Failed to toggle maintenance mode' });
      }
    });

    // Handle system statistics
    socket.on('get-system-stats', async () => {
      try {
        if (!socket.userId || !isAdmin(socket)) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        const db = await getDb();
        
        // Get various statistics
        const stats = await getOne(`
          SELECT 
            (SELECT COUNT(*) FROM users) as total_users,
            (SELECT COUNT(*) FROM users WHERE created_at >= datetime('now', '-24 hours')) as new_users_24h,
            (SELECT COUNT(*) FROM user_bets WHERE created_at >= datetime('now', '-24 hours')) as bets_24h,
            (SELECT SUM(amount) FROM user_bets WHERE created_at >= datetime('now', '-24 hours')) as total_bet_amount_24h,
            (SELECT COUNT(*) FROM chat_messages WHERE created_at >= datetime('now', '-24 hours')) as messages_24h,
            (SELECT COUNT(*) FROM users WHERE status = 'banned') as banned_users,
            (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users
        `);

        socket.emit('system-stats', {
          ...stats,
          timestamp: new Date().toISOString()
        });

        console.log(`System stats requested by admin ${socket.userId}`);
      } catch (error) {
        console.error('System stats error:', error);
        socket.emit('error', { message: 'Failed to get system stats' });
      }
    });

    // Handle admin logs
    socket.on('get-admin-logs', async (data: { limit?: number; offset?: number }) => {
      try {
        if (!socket.userId || !isAdmin(socket)) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        const db = await getDb();
        const limit = data.limit || 100;
        const offset = data.offset || 0;
        
        const { getAll } = await import('@/lib/db');
        const logs = await getAll(
          `SELECT al.*, u.displayName as admin_name
           FROM admin_logs al
           JOIN users u ON al.admin_id = u.id
           ORDER BY al.created_at DESC
           LIMIT ? OFFSET ?`,
          [limit, offset]
        );

        socket.emit('admin-logs', {
          logs,
          limit,
          offset,
          timestamp: new Date().toISOString()
        });

        console.log(`Admin logs requested by ${socket.userId}`);
      } catch (error) {
        console.error('Admin logs error:', error);
        socket.emit('error', { message: 'Failed to get admin logs' });
      }
    });

    // Handle user lookup
    socket.on('lookup-user', async (data: { identifier: string }) => {
      try {
        if (!socket.userId || !canModerate(socket)) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        const db = await getDb();
        const user = await getOne(
          `SELECT u.*, 
                  (SELECT COUNT(*) FROM user_bets WHERE user_id = u.id) as total_bets,
                  (SELECT SUM(amount) FROM user_bets WHERE user_id = u.id) as total_bet_amount,
                  (SELECT COUNT(*) FROM user_bets WHERE user_id = u.id AND status = 'won') as won_bets,
                  (SELECT COUNT(*) FROM chat_messages WHERE user_id = u.id) as total_messages
           FROM users u
           WHERE u.id = ? OR u.displayName LIKE ? OR u.email LIKE ?`,
          [data.identifier, `%${data.identifier}%`, `%${data.identifier}%`]
        );

        if (user) {
          socket.emit('user-lookup-result', {
            user,
            timestamp: new Date().toISOString()
          });
        } else {
          socket.emit('user-lookup-result', {
            user: null,
            message: 'User not found',
            timestamp: new Date().toISOString()
          });
        }

        console.log(`User lookup: ${socket.userId} searched for "${data.identifier}"`);
      } catch (error) {
        console.error('User lookup error:', error);
        socket.emit('error', { message: 'Failed to lookup user' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Admin socket disconnected: ${socket.userId}`);
    });
  };
}
