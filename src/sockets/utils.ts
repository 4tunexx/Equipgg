import { AuthenticatedSocket } from './types';
import { supabase } from '../lib/supabase';

export async function authenticateSocket(socket: any): Promise<AuthenticatedSocket | null> {
  try {
    // For development, allow simple user ID-based authentication
    const userId = socket.handshake.auth.accessToken?.replace('user-', '');
    
    if (!userId) {
      console.log('No user ID provided for socket authentication');
      return null;
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('display_name, role, email')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile) {
      console.log('User profile not found for socket auth:', userId);
      return null;
    }

    // Attach user info to socket
    socket.userId = userId;
    socket.username = profile.display_name || profile.email?.split('@')[0];
    socket.role = profile.role || 'user';

    return socket as AuthenticatedSocket;
  } catch (error) {
    console.error('Socket authentication error:', error);
    return null;
  }
}

export function joinUserRoom(socket: AuthenticatedSocket) {
  if (socket.userId) {
    socket.join(`user-${socket.userId}`);
    console.log(`User ${socket.userId} joined their personal room`);
  }
}

export function joinGameRoom(socket: AuthenticatedSocket, gameType: string, gameId?: string) {
  const roomName = gameId ? `game-${gameType}-${gameId}` : `game-${gameType}`;
  socket.join(roomName);
  console.log(`User ${socket.userId} joined ${roomName}`);
}

export function joinChatRoom(socket: AuthenticatedSocket, channel: string) {
  const roomName = `chat-${channel}`;
  socket.join(roomName);
  console.log(`User ${socket.userId} joined ${roomName}`);
}

export function isAdmin(socket: AuthenticatedSocket): boolean {
  return socket.role === 'admin' || socket.role === 'moderator';
}

export function canModerate(socket: AuthenticatedSocket): boolean {
  return socket.role === 'admin' || socket.role === 'moderator';
}

export function emitToUser(io: any, userId: string, event: string, data: any) {
  io.to(`user-${userId}`).emit(event, data);
}

export function emitToGame(io: any, gameType: string, event: string, data: any, gameId?: string) {
  const roomName = gameId ? `game-${gameType}-${gameId}` : `game-${gameType}`;
  io.to(roomName).emit(event, data);
}

export function emitToChat(io: any, channel: string, event: string, data: any) {
  io.to(`chat-${channel}`).emit(event, data);
}

export function emitToAdmins(io: any, event: string, data: any) {
  io.to('admin-room').emit(event, data);
}

export function emitToAll(io: any, event: string, data: any) {
  io.emit(event, data);
}

export function createEventData<T extends { timestamp: string; userId: string }>(
  userId: string,
  data: Omit<T, 'timestamp' | 'userId'>
): T {
  return {
    ...data,
    userId,
    timestamp: new Date().toISOString(),
  } as T;
}
