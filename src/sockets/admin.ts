import { Server } from 'socket.io';
import { AuthenticatedSocket, AdminBroadcastEvent, ModerationActionEvent } from './types';
import { emitToAll, emitToAdmins, emitToUser, isAdmin, canModerate } from './utils';
import { supabase } from '@/lib/supabaseClient';

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

        // Log the broadcast in Supabase
        const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const { error: logError } = await supabase.from('admin_logs').insert({
          id: logId,
          admin_id: socket.userId,
          action: 'broadcast',
          details: JSON.stringify(broadcastEvent),
          created_at: new Date().toISOString()
        });
        if (logError) {
          console.error('Supabase error logging admin broadcast:', logError);
        }

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

        // Update odds in Supabase
        const { error: oddsError } = await supabase
          .from('matches')
          .update({
            odds1: data.team1Odds,
            odds2: data.team2Odds,
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.matchId);
        if (oddsError) throw oddsError;

        // Log the override in Supabase
        const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const { error: logError } = await supabase.from('admin_logs').insert({
          id: logId,
          admin_id: socket.userId,
          action: 'odds_override',
          details: JSON.stringify({ matchId: data.matchId, team1Odds: data.team1Odds, team2Odds: data.team2Odds, reason: data.reason }),
          created_at: new Date().toISOString(),
        });
        if (logError) throw logError;

        // Emit to all users
        emitToAll(io, 'odds-override', {
          matchId: data.matchId,
          team1Odds: data.team1Odds,
          team2Odds: data.team2Odds,
          reason: data.reason,
          adminId: socket.userId,
          adminName: socket.username || 'Admin',
          timestamp: new Date().toISOString(),
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

        const banId = `ban_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const expiresAt = data.duration ? new Date(Date.now() + data.duration * 1000).toISOString() : null;

        // Create ban record in Supabase
        const { error: banError } = await supabase.from('user_bans').insert({
          id: banId,
          user_id: data.targetUserId,
          banned_by: socket.userId,
          reason: data.reason,
          expires_at: expiresAt,
          created_at: new Date().toISOString(),
        });
        if (banError) throw banError;

        // Update user status in Supabase
        const { error: userError } = await supabase
          .from('users')
          .update({ status: 'banned', banned_at: new Date().toISOString() })
          .eq('id', data.targetUserId);
        if (userError) throw userError;

        const banEvent: ModerationActionEvent = {
          userId: socket.userId,
          targetUserId: data.targetUserId,
          action: 'ban',
          reason: data.reason,
          duration: data.duration,
          timestamp: new Date().toISOString(),
        };

        // Emit to target user
        emitToUser(io, data.targetUserId, 'user-banned', {
          ...banEvent,
          moderatorName: socket.username || 'Moderator',
        });

        // Emit to moderators
        emitToAdmins(io, 'user-banned', {
          ...banEvent,
          moderatorName: socket.username || 'Moderator',
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

        const muteId = `mute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const expiresAt = new Date(Date.now() + data.duration * 1000).toISOString();

        // Create mute record in Supabase
        const { error: muteError } = await supabase.from('user_mutes').insert({
          id: muteId,
          user_id: data.targetUserId,
          muted_by: socket.userId,
          reason: data.reason,
          expires_at: expiresAt,
          created_at: new Date().toISOString(),
        });
        if (muteError) throw muteError;

        const muteEvent: ModerationActionEvent = {
          userId: socket.userId,
          targetUserId: data.targetUserId,
          action: 'mute',
          reason: data.reason,
          duration: data.duration,
          timestamp: new Date().toISOString(),
        };

        // Emit to target user
        emitToUser(io, data.targetUserId, 'user-muted', {
          ...muteEvent,
          moderatorName: socket.username || 'Moderator',
        });

        // Emit to moderators
        emitToAdmins(io, 'user-muted', {
          ...muteEvent,
          moderatorName: socket.username || 'Moderator',
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

        // Update maintenance mode in Supabase
        const { error: modeError } = await supabase
          .from('site_settings')
          .update({ value: data.enabled ? 'true' : 'false', updated_at: new Date().toISOString() })
          .eq('key', 'maintenance_mode');
        if (modeError) throw modeError;

        if (data.message) {
          const { error: msgError } = await supabase
            .from('site_settings')
            .update({ value: data.message, updated_at: new Date().toISOString() })
            .eq('key', 'maintenance_message');
          if (msgError) throw msgError;
        }

        // Emit to all users
        emitToAll(io, 'maintenance-mode', {
          enabled: data.enabled,
          message: data.message || 'Site is under maintenance. Please try again later.',
          timestamp: new Date().toISOString(),
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

        // Get various statistics from Supabase
        const [usersRes, newUsersRes, betsRes, betAmountsRes, messagesRes, bannedRes, activeRes] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
          supabase.from('user_bets').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
          supabase.from('user_bets').select('amount,created_at').gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
          supabase.from('chat_messages').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
          supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'banned'),
          supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        ]);

        // Calculate total bet amount for last 24h
        let totalBetAmount = 0;
        if (Array.isArray(betAmountsRes.data)) {
          totalBetAmount = betAmountsRes.data.reduce((sum: number, b: any) => sum + (b.amount || 0), 0);
        }

        socket.emit('system-stats', {
          total_users: usersRes.count || 0,
          new_users_24h: newUsersRes.count || 0,
          bets_24h: betsRes.count || 0,
          total_bet_amount_24h: totalBetAmount,
          messages_24h: messagesRes.count || 0,
          banned_users: bannedRes.count || 0,
          active_users: activeRes.count || 0,
          timestamp: new Date().toISOString(),
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

        const limit = data.limit || 100;
        const offset = data.offset || 0;
        const { data: logs, error: logsError } = await supabase
          .from('admin_logs')
          .select('*, users:admin_id(displayName)')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (logsError) throw logsError;

        socket.emit('admin-logs', {
          logs,
          limit,
          offset,
          timestamp: new Date().toISOString(),
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

        // Search for user in Supabase
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('*')
          .or(`id.eq.${data.identifier},displayName.ilike.%${data.identifier}%,email.ilike.%${data.identifier}%`)
          .limit(1);
        if (userError) throw userError;

        let user = users && users[0];
        if (user) {
          // Get user stats
          const [bets, wonBets, totalBetAmount, totalMessages] = await Promise.all([
            supabase.from('user_bets').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
            supabase.from('user_bets').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'won'),
            supabase.from('user_bets').select('amount').eq('user_id', user.id),
            supabase.from('chat_messages').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          ]);
          let totalBetSum = 0;
          if (Array.isArray(totalBetAmount.data)) {
            totalBetSum = totalBetAmount.data.reduce((sum: number, b: any) => sum + (b.amount || 0), 0);
          }
          user = {
            ...user,
            total_bets: bets.count || 0,
            won_bets: wonBets.count || 0,
            total_bet_amount: totalBetSum,
            total_messages: totalMessages.count || 0,
          };
        }

        if (user) {
          socket.emit('user-lookup-result', {
            user,
            timestamp: new Date().toISOString(),
          });
        } else {
          socket.emit('user-lookup-result', {
            user: null,
            message: 'User not found',
            timestamp: new Date().toISOString(),
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
