import { Server } from 'socket.io';
import { AuthenticatedSocket } from './types';
import { authenticateSocket } from './utils';
import { setupGamesSocket } from './games';
import { setupBettingSocket } from './betting';
import { setupXpSocket } from './xp';
import { setupAchievementsSocket } from './achievements';
import { setupInventorySocket } from './inventory';
import { setupLeaderboardsSocket } from './leaderboards';
import { setupChatSocket } from './chat';
import { setupAdminSocket } from './admin';

export function setupSocketHandlers(io: Server) {
  io.on('connection', async (socket) => {
    console.log('New socket connection:', socket.id);

    // Authenticate the socket
    const authenticatedSocket = await authenticateSocket(socket);
    
    if (!authenticatedSocket) {
      console.log('Socket authentication failed:', socket.id);
      socket.emit('error', { message: 'Authentication failed' });
      socket.disconnect();
      return;
    }

    console.log('Socket authenticated:', authenticatedSocket.userId);

    // Set up all socket handlers
    const gamesHandler = setupGamesSocket(io);
    const bettingHandler = setupBettingSocket(io);
    const xpHandler = setupXpSocket(io);
    const achievementsHandler = setupAchievementsSocket(io);
    const inventoryHandler = setupInventorySocket(io);
    const leaderboardsHandler = setupLeaderboardsSocket(io);
    const chatHandler = setupChatSocket(io);
    const adminHandler = setupAdminSocket(io);

    // Apply all handlers to the authenticated socket
    gamesHandler(authenticatedSocket);
    bettingHandler(authenticatedSocket);
    xpHandler(authenticatedSocket);
    achievementsHandler(authenticatedSocket);
    inventoryHandler(authenticatedSocket);
    leaderboardsHandler(authenticatedSocket);
    chatHandler(authenticatedSocket);
    adminHandler(authenticatedSocket);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${authenticatedSocket.userId} - ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${authenticatedSocket.userId}:`, error);
    });
  });
}

// Export all socket types and utilities
export * from './types';
export * from './utils';
export * from './games';
export * from './betting';
export * from './xp';
export * from './achievements';
export * from './inventory';
export * from './leaderboards';
export * from './chat';
export * from './admin';
