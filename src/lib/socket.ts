import { io, Socket } from 'socket.io-client';

class SocketManager {
  private socket: Socket | null = null;
  private isConnecting = false;

  connect() {
    if (this.socket?.connected || this.isConnecting) {
      return this.socket;
    }

    // Detect Vercel production environment
    const isVercelProduction = typeof window !== 'undefined' && 
      (window.location.hostname === 'www.equipgg.net' || 
       window.location.hostname === 'equipgg.net' ||
       window.location.hostname.includes('vercel.app'));

    // Skip Socket.IO on Vercel production (not supported in serverless)
    if (isVercelProduction) {
      console.log('🔌 Socket.IO disabled on Vercel - using fallback mode');
      this.isConnecting = false;
      return null;
    }

    this.isConnecting = true;
    console.log('🔌 Connecting to Socket.IO server...');

    const socketUrl = `http://localhost:${process.env.NEXT_PUBLIC_SOCKET_PORT || 3001}`;

    console.log('🌐 Socket URL:', socketUrl);

    this.socket = io(socketUrl, {
      path: '/api/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server:', this.socket?.id);
      this.isConnecting = false;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from Socket.IO server:', reason);
      this.isConnecting = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('🚨 Socket.IO connection error:', error);
      this.isConnecting = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Chat methods
  joinChat(channelId: string) {
    this.socket?.emit('join-chat', channelId);
  }

  sendMessage(message: {
    id: string;
    message: string;
    sender: any;
    channelId: string;
    timestamp: string;
  }) {
    this.socket?.emit('send-message', message);
  }

  onNewMessage(callback: (message: any) => void) {
    this.socket?.on('new-message', callback);
  }

  // Notification methods
  sendNotification(notification: {
    type: string;
    title: string;
    message: string;
    userId?: string;
  }) {
    this.socket?.emit('send-notification', notification);
  }

  onNotification(callback: (notification: any) => void) {
    this.socket?.on('notification', callback);
  }

  // Game methods
  joinGame(gameId: string) {
    this.socket?.emit('join-game', gameId);
  }

  sendGameUpdate(update: any) {
    this.socket?.emit('game-update', update);
  }

  onGameUpdate(callback: (update: any) => void) {
    this.socket?.on('game-state-update', callback);
  }

  // Betting methods
  joinBetting(matchId: string) {
    this.socket?.emit('join-betting', matchId);
  }

  notifyBetPlaced(bet: {
    matchId: string;
    amount: number;
    team: string;
    odds: number;
  }) {
    this.socket?.emit('bet-placed', bet);
  }

  onNewBet(callback: (bet: any) => void) {
    this.socket?.on('new-bet', callback);
  }

  // Achievement methods
  notifyAchievementUnlocked(data: {
    userId: string;
    achievement: any;
  }) {
    this.socket?.emit('achievement-unlocked', data);
  }

  onAchievementUnlocked(callback: (data: any) => void) {
    this.socket?.on('user-achievement', callback);
  }

  // XP methods
  notifyXPGained(data: {
    userId: string;
    xpGained: number;
    newLevel?: number;
    reason: string;
  }) {
    this.socket?.emit('xp-gained', data);
  }

  onXPUpdate(callback: (data: any) => void) {
    this.socket?.on('xp-update', callback);
  }

  // User count methods
  requestUserCount() {
    this.socket?.emit('request-user-count');
  }

  onUserCountUpdate(callback: (data: { count: number }) => void) {
    this.socket?.on('user-count-update', callback);
  }

  // Generic event methods
  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  emit(event: string, ...args: any[]) {
    this.socket?.emit(event, ...args);
  }
}

// Create a singleton instance
export const socketManager = new SocketManager();

// Helper hook for React components
import { useEffect, useState } from 'react';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = socketManager.connect();
    setSocket(socketInstance);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socketInstance?.on('connect', handleConnect);
    socketInstance?.on('disconnect', handleDisconnect);

    // Set initial connection state
    setIsConnected(socketInstance?.connected || false);

    return () => {
      socketInstance?.off('connect', handleConnect);
      socketInstance?.off('disconnect', handleDisconnect);
    };
  }, []);

  return { socket, isConnected, socketManager };
}