import { NextRequest, NextResponse } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';

// Global Socket.IO server instance
let io: SocketIOServer | undefined;

export async function GET(req: NextRequest) {
  // Initialize Socket.IO server if not already done
  if (!io) {
    console.log('🚀 Initializing Socket.IO server...');
    
    const httpServer = createServer();
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: ["http://localhost:3001", "https://www.equipgg.net"],
        methods: ["GET", "POST"],
        credentials: true
      },
      path: '/api/socket.io',
      transports: ['websocket', 'polling']
    });

    // Set up Socket.IO event handlers
    io.on('connection', (socket) => {
      console.log('👤 User connected:', socket.id);
      
      // Join specific rooms
      socket.on('join-room', (room) => {
        socket.join(room);
        console.log(`🚪 User ${socket.id} joined room: ${room}`);
      });

      // Chat system
      socket.on('join-chat', (channelId) => {
        socket.join(`chat:${channelId}`);
        console.log(`💬 User ${socket.id} joined chat: ${channelId}`);
      });

      socket.on('send-message', (data) => {
        console.log('📤 Broadcasting message to chat:', data.channelId);
        socket.to(`chat:${data.channelId}`).emit('new-message', {
          id: data.id,
          message: data.message,
          sender: data.sender,
          timestamp: data.timestamp,
          channelId: data.channelId
        });
      });

      // Notifications
      socket.on('send-notification', (data) => {
        console.log('🔔 Broadcasting notification:', data.type);
        io?.emit('notification', {
          type: data.type,
          title: data.title,
          message: data.message,
          userId: data.userId,
          timestamp: new Date().toISOString()
        });
      });

      // Game updates
      socket.on('join-game', (gameId) => {
        socket.join(`game:${gameId}`);
        console.log(`🎮 User ${socket.id} joined game: ${gameId}`);
      });

      socket.on('game-update', (data) => {
        socket.to(`game:${data.gameId}`).emit('game-state-update', data);
      });

      // Betting updates
      socket.on('join-betting', (matchId) => {
        socket.join(`betting:${matchId}`);
        console.log(`🎲 User ${socket.id} joined betting for match: ${matchId}`);
      });

      socket.on('bet-placed', (data) => {
        io?.to(`betting:${data.matchId}`).emit('new-bet', {
          matchId: data.matchId,
          amount: data.amount,
          team: data.team,
          odds: data.odds,
          timestamp: new Date().toISOString()
        });
      });

      // Achievement and XP updates
      socket.on('achievement-unlocked', (data) => {
        io?.emit('user-achievement', {
          userId: data.userId,
          achievement: data.achievement,
          timestamp: new Date().toISOString()
        });
      });

      socket.on('xp-gained', (data) => {
        socket.emit('xp-update', {
          userId: data.userId,
          xpGained: data.xpGained,
          newLevel: data.newLevel,
          reason: data.reason
        });
      });

      // Live user count
      socket.on('request-user-count', () => {
        const userCount = io?.engine.clientsCount || 0;
        socket.emit('user-count-update', { count: userCount });
      });

      socket.on('disconnect', (reason) => {
        console.log('👋 User disconnected:', socket.id, 'Reason:', reason);
      });
    });

    // Start the server on a different port for Socket.IO
    const port = process.env.SOCKET_PORT || 3002;
    httpServer.listen(port, () => {
      console.log(`✅ Socket.IO server running on port ${port}`);
    });
  }

  return NextResponse.json({ 
    message: 'Socket.IO server initialized',
    connected: io?.engine.clientsCount || 0,
    port: process.env.SOCKET_PORT || 3002
  });
}

// Export the Socket.IO instance for use in other parts of the app
export { io };