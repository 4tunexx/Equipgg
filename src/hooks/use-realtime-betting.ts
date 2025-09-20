'use client';

import { useEffect, useCallback } from 'react';
import { useSocket } from "../contexts/socket-context";
import { useAuth } from "../components/auth-provider";
import { useBalance } from "../contexts/balance-context";
import { toast } from 'sonner';

interface BetPlacedEvent {
  userId: string;
  username: string;
  matchId: string;
  team: string;
  amount: number;
  timestamp: string;
}

interface BetResultEvent {
  betId: string;
  matchId: string;
  won: boolean;
  amount: number;
  winnings: number;
  timestamp: string;
}

interface XpGainedEvent {
  userId: string;
  amount: number;
  source: string;
  newLevel?: number;
  leveledUp?: boolean;
  timestamp: string;
}

interface BalanceUpdatedEvent {
  userId: string;
  coins: number;
  gems: number;
  xp: number;
  level: number;
  timestamp: string;
}

export function useRealtimeBetting() {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const { updateBalance } = useBalance();

  // Listen for bet placed events
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleBetPlaced = (data: BetPlacedEvent) => {
      // Only show notifications for other users' bets
      if (data.userId !== user?.id && data.amount && data.username && data.team) {
        toast.info(`${data.username} placed a ${(data.amount || 0).toLocaleString()} coin bet on ${data.team}`, {
          duration: 3000,
        });
      }
    };

    socket.on('betPlaced', handleBetPlaced);

    return () => {
      socket.off('betPlaced', handleBetPlaced);
    };
  }, [socket, isConnected, user?.id]);

  // Listen for bet result events
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    const handleBetResult = (data: BetResultEvent) => {
      if (data.won && data.winnings !== undefined) {
        toast.success(`🎉 You won ${(data.winnings || 0).toLocaleString()} coins!`, {
          duration: 5000,
        });
      } else if (data.amount !== undefined) {
        toast.error(`💸 Lost ${(data.amount || 0).toLocaleString()} coins`, {
          duration: 3000,
        });
      }
    };

    socket.on('betResult', handleBetResult);

    return () => {
      socket.off('betResult', handleBetResult);
    };
  }, [socket, isConnected, user]);

  // Listen for XP gained events
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    const handleXpGained = (data: XpGainedEvent) => {
      if (data.userId === user.id) {
        if (data.leveledUp) {
          toast.success(`🎉 Level Up! You're now level ${data.newLevel}!`, {
            duration: 5000,
          });
        } else {
          toast.info(`+${data.amount} XP from ${data.source}`, {
            duration: 2000,
          });
        }
      }
    };

    socket.on('xpGained', handleXpGained);

    return () => {
      socket.off('xpGained', handleXpGained);
    };
  }, [socket, isConnected, user]);

  // Listen for balance updates
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    const handleBalanceUpdated = (data: BalanceUpdatedEvent) => {
      if (data.userId === user.id) {
        updateBalance({
          coins: data.coins,
          gems: data.gems,
          xp: data.xp,
          level: data.level,
        });
      }
    };

    socket.on('balanceUpdated', handleBalanceUpdated);

    return () => {
      socket.off('balanceUpdated', handleBalanceUpdated);
    };
  }, [socket, isConnected, user, updateBalance]);

  return {
    isConnected,
  };
}
