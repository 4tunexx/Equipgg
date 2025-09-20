import { Server } from 'socket.io';
import { AuthenticatedSocket, ChatMessageEvent, UserJoinedEvent, UserLeftEvent } from './types';
import { emitToChat, emitToUser, createEventData, joinChatRoom, canModerate } from './utils';
import { supabase } from '../lib/supabase';

export function setupChatSocket(io: Server) {
  return (socket: AuthenticatedSocket) => {
    console.log(`Chat socket connected: ${socket.userId}`);

    // Join user to their personal room
    socket.join(`user-${socket.userId}`);

    // Handle joining chat channels
    socket.on('join-chat', (data: { channel: string }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        joinChatRoom(socket, data.channel);

        // Emit user joined event
        const joinEvent: UserJoinedEvent = {
          userId: socket.userId,
          timestamp: new Date().toISOString(),
          channel: data.channel
        };

        emitToChat(io, data.channel, 'user-joined', {
          ...joinEvent,
          username: socket.username || 'Anonymous',
          channel: data.channel
        });

        console.log(`User ${socket.userId} joined chat channel: ${data.channel}`);
      } catch (error) {
        console.error('Join chat error:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Handle leaving chat channels
    socket.on('leave-chat', (data: { channel: string }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const roomName = `chat-${data.channel}`;
        socket.leave(roomName);

        // Emit user left event
        const leaveEvent: UserLeftEvent = {
          userId: socket.userId,
          timestamp: new Date().toISOString(),
          channel: data.channel
        };

        emitToChat(io, data.channel, 'user-left', {
          ...leaveEvent,
          username: socket.username || 'Anonymous',
          channel: data.channel
        });

        console.log(`User ${socket.userId} left chat channel: ${data.channel}`);
      } catch (error) {
        console.error('Leave chat error:', error);
        socket.emit('error', { message: 'Failed to leave chat' });
      }
    });

    // Handle chat messages
    socket.on('chat-message', async (data: Omit<ChatMessageEvent, 'timestamp' | 'userId'>) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Validate message
        if (!data.message || data.message.trim().length === 0) {
          socket.emit('error', { message: 'Message cannot be empty' });
          return;
        }

        if (data.message.length > 500) {
          socket.emit('error', { message: 'Message too long (max 500 characters)' });
          return;
        }

        // Check for spam/rate limiting
        const now = Date.now();
        const lastMessage = (socket as any).lastMessageTime || 0;
        if (now - lastMessage < 1000) { // 1 second cooldown
          socket.emit('error', { message: 'Please wait before sending another message' });
          return;
        }
        (socket as any).lastMessageTime = now;

        const messageEvent = createEventData(socket.userId, data);

        // Store message in Supabase
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const { error: insertError } = await supabase.from('chat_messages').insert({
          id: messageId,
          user_id: socket.userId,
          channel: data.channel,
          message: data.message,
          type: data.type,
          created_at: new Date().toISOString()
        });
        if (insertError) {
          console.error('Supabase error inserting chat message:', insertError);
          socket.emit('error', { message: 'Failed to store chat message' });
          return;
        }

        // Emit to chat channel
        emitToChat(io, data.channel, 'chat-message', {
          ...messageEvent,
          messageId,
          username: socket.username || 'Anonymous',
          avatar: (socket as any).avatar || null
        });

        console.log(`Chat message: User ${socket.userId} sent message in ${data.channel}`);
      } catch (error) {
        console.error('Chat message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle private messages
    socket.on('private-message', async (data: { targetUserId: string; message: string }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        if (!data.message || data.message.trim().length === 0) {
          socket.emit('error', { message: 'Message cannot be empty' });
          return;
        }

        if (data.message.length > 500) {
          socket.emit('error', { message: 'Message too long (max 500 characters)' });
          return;
        }

        const privateMessageEvent = {
          fromUserId: socket.userId,
          fromUsername: socket.username || 'Anonymous',
          toUserId: data.targetUserId,
          message: data.message,
          timestamp: new Date().toISOString()
        };

        // Emit to target user
        emitToUser(io, data.targetUserId, 'private-message', privateMessageEvent);

        // Emit to sender for confirmation
        emitToUser(io, socket.userId, 'private-message-sent', {
          ...privateMessageEvent,
          messageId: `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });

        console.log(`Private message: User ${socket.userId} sent PM to ${data.targetUserId}`);
      } catch (error) {
        console.error('Private message error:', error);
        socket.emit('error', { message: 'Failed to send private message' });
      }
    });

    // Handle chat history request
    socket.on('get-chat-history', async (data: { channel: string; limit?: number }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const limit = data.limit || 50;
        const { data: messages, error } = await supabase
          .from('chat_messages')
          .select('*, users:users!chat_messages_user_id_fkey(displayName, avatar_url)')
          .eq('channel', data.channel)
          .order('created_at', { ascending: false })
          .limit(limit);
        if (error) {
          console.error('Supabase error fetching chat history:', error);
          socket.emit('error', { message: 'Failed to get chat history' });
          return;
        }
        // Map messages to include username and avatar
        const formatted = (messages || []).map(m => ({
          ...m,
          username: m.users?.displayName || 'Anonymous',
          avatar: m.users?.avatar_url || null
        })).reverse();
        socket.emit('chat-history', {
          channel: data.channel,
          messages: formatted,
          timestamp: new Date().toISOString()
        });
        console.log(`Chat history requested: User ${socket.userId} - ${data.channel} (${formatted.length} messages)`);
      } catch (error) {
        console.error('Chat history error:', error);
        socket.emit('error', { message: 'Failed to get chat history' });
      }
    });

    // Handle moderation actions
    socket.on('moderate-user', async (data: { 
      targetUserId: string; 
      action: 'mute' | 'unmute' | 'ban' | 'unban'; 
      reason: string;
      duration?: number;
    }) => {
      try {
        if (!socket.userId || !canModerate(socket)) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        const moderationId = `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const { error: modError } = await supabase.from('moderation_actions').insert({
          id: moderationId,
          moderator_id: socket.userId,
          target_user_id: data.targetUserId,
          action: data.action,
          reason: data.reason,
          duration: data.duration || null,
          created_at: new Date().toISOString()
        });
        if (modError) {
          console.error('Supabase error inserting moderation action:', modError);
          socket.emit('error', { message: 'Failed to perform moderation action' });
          return;
        }

        const moderationEvent = {
          moderatorId: socket.userId,
          moderatorName: socket.username || 'Anonymous',
          targetUserId: data.targetUserId,
          action: data.action,
          reason: data.reason,
          duration: data.duration,
          timestamp: new Date().toISOString()
        };

        // Emit to target user
        emitToUser(io, data.targetUserId, 'moderation-action', moderationEvent);

        // Emit to moderators
        io.to('moderator-room').emit('moderation-action', moderationEvent);

        console.log(`Moderation action: ${socket.userId} ${data.action} ${data.targetUserId} - ${data.reason}`);
      } catch (error) {
        console.error('Moderation error:', error);
        socket.emit('error', { message: 'Failed to perform moderation action' });
      }
    });

    // Handle typing indicators
    socket.on('typing-start', (data: { channel: string }) => {
      if (!socket.userId) return;

      socket.to(`chat-${data.channel}`).emit('user-typing', {
        userId: socket.userId,
        username: socket.username || 'Anonymous',
        channel: data.channel,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('typing-stop', (data: { channel: string }) => {
      if (!socket.userId) return;

      socket.to(`chat-${data.channel}`).emit('user-stopped-typing', {
        userId: socket.userId,
        username: socket.username || 'Anonymous',
        channel: data.channel,
        timestamp: new Date().toISOString()
      });
    });

    // Handle online users request
    socket.on('get-online-users', (data: { channel: string }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const room = io.sockets.adapter.rooms.get(`chat-${data.channel}`);
        const onlineUsers = room ? Array.from(room).map(socketId => {
          const socket = io.sockets.sockets.get(socketId) as AuthenticatedSocket;
          return {
            userId: socket.userId,
            username: socket.username || 'Anonymous',
            avatar: (socket as any).avatar || null
          };
        }).filter(user => user.userId) : [];

        socket.emit('online-users', {
          channel: data.channel,
          users: onlineUsers,
          count: onlineUsers.length,
          timestamp: new Date().toISOString()
        });

        console.log(`Online users requested: User ${socket.userId} - ${data.channel} (${onlineUsers.length} users)`);
      } catch (error) {
        console.error('Online users error:', error);
        socket.emit('error', { message: 'Failed to get online users' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Chat socket disconnected: ${socket.userId}`);
    });
  };
}
