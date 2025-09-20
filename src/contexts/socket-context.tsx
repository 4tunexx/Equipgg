'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from "../components/auth-provider";
import { socketFallback } from "../lib/socket-fallback";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  emitBetPlaced: (data: BetPlacedData) => void;
  emitBetResult: (data: BetResultData) => void;
  emitXpGained: (data: XpGainedData) => void;
  emitInventoryChanged: (data: InventoryChangedData) => void;
  emitBalanceUpdated: (data: BalanceUpdatedData) => void;
}

interface BetPlacedData {
  userId: string;
  username: string;
  matchId: string;
  team: string;
  amount: number;
}

interface BetResultData {
  betId: string;
  userId: string;
  matchId: string;
  won: boolean;
  amount: number;
  winnings: number;
}

interface XpGainedData {
  userId: string;
  amount: number;
  source: string;
  newLevel?: number;
  leveledUp?: boolean;
}

interface InventoryChangedData {
  userId: string;
  action: 'add' | 'remove' | 'equip' | 'unequip';
  item: any;
}

interface BalanceUpdatedData {
  userId: string;
  coins: number;
  gems: number;
  xp: number;
  level: number;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Disable Socket.IO in production if no server is available
    if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_SOCKET_URL) {
      console.log('🔌 Socket.IO disabled in production (no server configured)');
      setIsConnected(false);
      return;
    }

    // Get Socket.IO URL from environment or use default
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
                     (process.env.NODE_ENV === 'production' ? 'https://www.equipgg.net' : 'http://localhost:3001');
    
    console.log('🚀 Initializing Socket.io connection to:', socketUrl);

    // Initialize socket connection
    const newSocket = io(socketUrl, {
      transports: ['polling', 'websocket'], // Try polling first, then websocket
      timeout: 10000,
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 3, // Reduce attempts to prevent spam
      forceNew: true
    });

    // Set a timeout for connection attempt
    const connectTimeout = setTimeout(() => {
      if (!newSocket.connected) {
        console.log('⏰ Socket connection timeout, using fallback mode');
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
        socketFallback.setConnected(false);
      }
    }, 8000); // Increased timeout

    newSocket.on('connect', () => {
      console.log('✅ Connected to Socket.io server');
      setIsConnected(true);
      socketFallback.setConnected(true);
      clearTimeout(connectTimeout);
    });

    newSocket.on('connect_error', (error) => {
      console.log('❌ Socket connection error:', error.message);
      setIsConnected(false);
      socketFallback.setConnected(false);
      // Don't spam reconnect attempts
      if (process.env.NODE_ENV === 'production') {
        newSocket.disconnect();
        clearTimeout(connectTimeout);
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from Socket.io server:', reason);
      setIsConnected(false);
      socketFallback.setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      socketFallback.setConnected(false);
      clearTimeout(connectTimeout);
    });

    // Try to connect
    newSocket.connect();

    setSocket(newSocket);

    return () => {
      clearTimeout(connectTimeout);
      newSocket.close();
    };
  }, []);

  // Join user room when user is available
  useEffect(() => {
    if (socket && user?.id) {
      socket.emit('join-user-room', user.id);
    }
  }, [socket, user?.id]);

  const emitBetPlaced = (data: BetPlacedData) => {
    if (socket && isConnected) {
      socket.emit('bet-placed', data);
    }
  };

  const emitBetResult = (data: BetResultData) => {
    if (socket && isConnected) {
      socket.emit('bet-result', data);
    }
  };

  const emitXpGained = (data: XpGainedData) => {
    if (socket && isConnected) {
      socket.emit('xp-gained', data);
    }
  };

  const emitInventoryChanged = (data: InventoryChangedData) => {
    if (socket && isConnected) {
      socket.emit('inventory-changed', data);
    }
  };

  const emitBalanceUpdated = (data: BalanceUpdatedData) => {
    if (socket && isConnected) {
      socket.emit('balance-updated', data);
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    emitBetPlaced,
    emitBetResult,
    emitXpGained,
    emitInventoryChanged,
    emitBalanceUpdated,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
