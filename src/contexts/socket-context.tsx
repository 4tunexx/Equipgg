'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/components/auth-provider';
import { socketFallback } from '@/lib/socket-fallback';

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
    // Disable socket in development and production mode to prevent timeout errors
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
      console.log('Socket.io disabled in development/production mode');
      setSocket(null);
      setIsConnected(false);
      socketFallback.setConnected(false);
      return;
    }

    // Initialize socket connection
    const newSocket = io('http://localhost:9003', {
      transports: ['websocket', 'polling'],
      timeout: 2000,
      autoConnect: false
    });

    // Set a timeout for connection
    const connectTimeout = setTimeout(() => {
      if (!newSocket.connected) {
        console.log('Socket connection timeout, disabling socket');
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
        socketFallback.setConnected(false);
      }
    }, 3000);

    newSocket.on('connect', () => {
      console.log('Connected to Socket.io server');
      setIsConnected(true);
      socketFallback.setConnected(true);
      clearTimeout(connectTimeout);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from Socket.io server');
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
