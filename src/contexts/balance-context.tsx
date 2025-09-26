'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from "../components/auth-provider";

interface UserBalance {
  coins: number;
  gems: number;
  xp: number;
  level: number;
}

interface BalanceContextType {
  balance: UserBalance | null;
  isLoading: boolean;
  refreshBalance: () => Promise<void>;
  updateBalance: (updates: Partial<UserBalance>) => void;
  handleImmediateBalanceUpdate: (newBalance: number) => void;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export function BalanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBalance = React.useCallback(async () => {
    if (!user) {
      console.log('🔄 No user found, clearing balance');
      setBalance(null);
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔄 Fetching balance for user:', user.id);
      const response = await fetch(`/api/user/stats?t=${Date.now()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔄 Balance data received:', data);
        setBalance({
          coins: data.stats.coins || 0,
          gems: data.stats.gems || 0,
          xp: data.stats.xp || 0,
          level: data.stats.level || 1
        });
      } else if (response.status === 401) {
        console.log('🔄 User not authenticated, clearing balance');
        setBalance(null);
      } else {
        console.error('Failed to fetch balance:', response.status);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const refreshBalance = React.useCallback(async () => {
    console.log('🔄 Refreshing balance...');
    setIsLoading(true);
    try {
      await fetchBalance();
    } catch (error) {
      console.error('Error refreshing balance:', error);
    }
  }, [fetchBalance]);

  const updateBalance = (updates: Partial<UserBalance>) => {
    setBalance(prev => prev ? { ...prev, ...updates } : null);
  };

  // Add a function to handle immediate balance updates from events
  const handleImmediateBalanceUpdate = (newBalance: number) => {
    setBalance(prev => prev ? { ...prev, coins: newBalance } : null);
  };

  useEffect(() => {
    fetchBalance();
  }, [user, fetchBalance]);

  // Listen for balance update events
  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent) => {
      console.log('🔄 Balance update event received:', event.detail);
      
      // If we have the new balance from the event, update immediately
      if (event.detail?.newBalance !== undefined) {
        console.log('🔄 Updating balance immediately to:', event.detail.newBalance);
        handleImmediateBalanceUpdate(event.detail.newBalance);
      }
      
      // Refresh balance immediately and then again after delays to ensure we get the latest data
      refreshBalance();
      setTimeout(() => {
        console.log('🔄 First delayed refresh...');
        refreshBalance();
      }, 500);
      setTimeout(() => {
        console.log('🔄 Second delayed refresh...');
        refreshBalance();
      }, 1500);
    };

    const handleKeyUpdate = () => {
      console.log('🔑 Key update event received, refreshing balance...');
      refreshBalance();
    };

    const handleGameCompleted = () => {
      console.log('🎮 Game completed event received, refreshing balance...');
      refreshBalance();
    };

    const handleInventoryUpdate = () => {
      console.log('📦 Inventory update event received, refreshing balance...');
      refreshBalance();
    };

    window.addEventListener('balanceUpdated', handleBalanceUpdate as EventListener);
    window.addEventListener('keyUpdated', handleKeyUpdate);
    window.addEventListener('gameCompleted', handleGameCompleted);
    window.addEventListener('inventoryUpdate', handleInventoryUpdate);

    return () => {
      window.removeEventListener('balanceUpdated', handleBalanceUpdate as EventListener);
      window.removeEventListener('keyUpdated', handleKeyUpdate);
      window.removeEventListener('gameCompleted', handleGameCompleted);
      window.removeEventListener('inventoryUpdate', handleInventoryUpdate);
    };
  }, [refreshBalance, user]);

  return (
    <BalanceContext.Provider value={{
      balance,
      isLoading,
      refreshBalance,
      updateBalance,
      handleImmediateBalanceUpdate
    }}>
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalance() {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
}
