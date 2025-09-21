#!/usr/bin/env node

/**
 * Equipgg Socket.IO Server
 * Handles real-time features like:
 * - XP gains and level ups
 * - Live notifications
 * - Chat messages
 * - Match result confetti
 * - Balance updates
 * - Inventory changes
 */

const { createServer } = require('http');
const { Server } = require('socket.io');

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:9003", "https://www.equipgg.net"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Store connected users
const connectedUsers = new Map();
const userRooms = new Map();

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // Handle user joining their personal room
  socket.on('join-user-room', (userId) => {
    if (userId) {
      const oldSocketId = userRooms.get(userId);
      if (oldSocketId && oldSocketId !== socket.id) {
        // Disconnect old socket if user connects from another tab
        const oldSocket = io.sockets.sockets.get(oldSocketId);
        if (oldSocket) {
          oldSocket.disconnect();
        }
      }
      
      socket.join(`user-${userId}`);
      connectedUsers.set(socket.id, userId);
      userRooms.set(userId, socket.id);
      
      console.log(`👤 User ${userId} joined their room`);
      
      // Send connection confirmation
      socket.emit('connected', { userId, socketId: socket.id });
    }
  });

  // Handle XP gained events
  socket.on('xp-gained', (data) => {
    const { userId, amount, source, newLevel, leveledUp } = data;
    
    // Broadcast to user's room
    io.to(`user-${userId}`).emit('xp-gained', {
      amount,
      source,
      newLevel,
      leveledUp,
      timestamp: Date.now()
    });

    // If leveled up, show special notification
    if (leveledUp) {
      io.to(`user-${userId}`).emit('level-up', {
        newLevel,
        timestamp: Date.now()
      });
    }

    console.log(`✨ XP gained: User ${userId} got ${amount} XP from ${source}${leveledUp ? ` - LEVEL UP to ${newLevel}!` : ''}`);
  });

  // Handle balance updates
  socket.on('balance-updated', (data) => {
    const { userId, coins, gems, xp, level } = data;
    
    io.to(`user-${userId}`).emit('balance-updated', {
      coins,
      gems,
      xp,
      level,
      timestamp: Date.now()
    });

    console.log(`💰 Balance updated: User ${userId} - Coins: ${coins}, Gems: ${gems}, XP: ${xp}, Level: ${level}`);
  });

  // Handle bet placed events
  socket.on('bet-placed', (data) => {
    const { userId, username, matchId, team, amount } = data;
    
    // Notify user
    io.to(`user-${userId}`).emit('bet-confirmed', {
      matchId,
      team,
      amount,
      timestamp: Date.now()
    });

    console.log(`🎲 Bet placed: ${username} bet ${amount} on ${team} for match ${matchId}`);
  });

  // Handle bet results
  socket.on('bet-result', (data) => {
    const { betId, userId, matchId, won, amount, winnings } = data;
    
    // Notify user of result
    io.to(`user-${userId}`).emit('bet-result', {
      betId,
      matchId,
      won,
      amount,
      winnings,
      timestamp: Date.now()
    });

    // If won, trigger confetti
    if (won) {
      io.to(`user-${userId}`).emit('confetti', {
        type: 'win',
        amount: winnings,
        source: 'bet',
        timestamp: Date.now()
      });
    }

    console.log(`🎯 Bet result: User ${userId} ${won ? 'WON' : 'LOST'} bet ${betId} - ${won ? `Won ${winnings}` : `Lost ${amount}`}`);
  });

  // Handle inventory changes
  socket.on('inventory-changed', (data) => {
    const { userId, action, item } = data;
    
    io.to(`user-${userId}`).emit('inventory-changed', {
      action,
      item,
      timestamp: Date.now()
    });

    console.log(`📦 Inventory: User ${userId} ${action} item ${item.name || item.id}`);
  });

  // Handle chat messages
  socket.on('chat-message', (data) => {
    const { userId, username, channel, message, avatar } = data;
    
    // Broadcast to channel
    io.to(`chat-${channel}`).emit('chat-message', {
      userId,
      username,
      message,
      avatar,
      timestamp: Date.now()
    });

    console.log(`💬 Chat [${channel}]: ${username}: ${message}`);
  });

  // Handle joining chat channels
  socket.on('join-chat', (channel) => {
    socket.join(`chat-${channel}`);
    console.log(`💬 Socket ${socket.id} joined chat: ${channel}`);
  });

  // Handle leaving chat channels
  socket.on('leave-chat', (channel) => {
    socket.leave(`chat-${channel}`);
    console.log(`💬 Socket ${socket.id} left chat: ${channel}`);
  });

  // Handle game results with confetti
  socket.on('game-result', (data) => {
    const { userId, game, won, amount, multiplier } = data;
    
    io.to(`user-${userId}`).emit('game-result', {
      game,
      won,
      amount,
      multiplier,
      timestamp: Date.now()
    });

    // Trigger confetti for wins
    if (won) {
      io.to(`user-${userId}`).emit('confetti', {
        type: 'game-win',
        game,
        amount,
        multiplier,
        timestamp: Date.now()
      });
    }

    console.log(`🎮 Game result: User ${userId} ${won ? 'WON' : 'LOST'} ${game} - ${won ? `Won ${amount} (${multiplier}x)` : `Lost ${amount}`}`);
  });

  // Handle mission completions
  socket.on('mission-completed', (data) => {
    const { userId, missionId, reward } = data;
    
    io.to(`user-${userId}`).emit('mission-completed', {
      missionId,
      reward,
      timestamp: Date.now()
    });

    console.log(`🎯 Mission completed: User ${userId} completed mission ${missionId} - Reward: ${reward}`);
  });

  // Handle achievements
  socket.on('achievement-unlocked', (data) => {
    const { userId, achievementId, title, description, reward } = data;
    
    io.to(`user-${userId}`).emit('achievement-unlocked', {
      achievementId,
      title,
      description,
      reward,
      timestamp: Date.now()
    });

    // Special confetti for achievements
    io.to(`user-${userId}`).emit('confetti', {
      type: 'achievement',
      achievementId,
      title,
      timestamp: Date.now()
    });

    console.log(`🏆 Achievement: User ${userId} unlocked "${title}"`);
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    const userId = connectedUsers.get(socket.id);
    if (userId) {
      connectedUsers.delete(socket.id);
      userRooms.delete(userId);
    }
    console.log(`❌ User disconnected: ${socket.id} (${reason})`);
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`🚨 Socket error for ${socket.id}:`, error);
  });
});

// Note: Health check endpoint removed to avoid HTTP header conflicts with Socket.IO
// Socket.IO handles all HTTP requests on this server

const PORT = process.env.SOCKET_PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Equipgg Socket.IO Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`⚡ Ready for real-time features: XP, chat, notifications, confetti!`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('✅ Socket.IO server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    console.log('✅ Socket.IO server closed');
    process.exit(0);
  });
});