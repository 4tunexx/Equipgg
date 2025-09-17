import { AuthenticatedSocket } from './types';
import { supabase } from '@/lib/supabaseClient';

export async function authenticateSocket(socket: any): Promise<AuthenticatedSocket | null> {
  try {
    // Get session from cookie or auth header
    const sessionId = socket.handshake.auth.sessionId || 
                     socket.handshake.headers.cookie?.match(/session-id=([^;]+)/)?.[1];
    
    if (!sessionId) {
      return null;
    }


    // Verify session in Supabase
    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .select('user_id, expires_at')
      .eq('id', sessionId)
      .gt('expires_at', new Date().toISOString())
      .single();
    if (sessionError || !session) {
      return null;
    }

    // Get user info from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, displayName, role')
      .eq('id', session.user_id)
      .single();
    if (userError || !user) {
      return null;
    }

    // Attach user info to socket
    socket.userId = user.id;
    socket.username = user.displayName;
    socket.role = user.role;

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
