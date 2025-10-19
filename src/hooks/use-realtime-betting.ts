'use client';

import { useEffect } from 'react';
import { useRealtime } from "../contexts/realtime-context";
import { useAuth } from "../components/auth-provider";
import { useBalance } from "../contexts/balance-context";
import { toast } from 'sonner';
import type { NewBetPayload, BetResultPayload, XpGainedPayload, LevelUpPayload, BalanceUpdatedPayload } from "../lib/supabase/realtime";

export function useRealtimeBetting() {
  const { isConnected, onNewBet, onBetResult, onXpGained, onLevelUp, onBalanceUpdated } = useRealtime();
  const { user } = useAuth();
  const { updateBalance } = useBalance();

  // Listen for bet placed events
  useEffect(() => {
    if (!isConnected) return;

    const handleBetPlaced = (data: NewBetPayload) => {
      // Only show notifications for other users' bets
      if (data.userId !== user?.id && data.amount && data.username && data.team) {
        toast.info(`${data.username} placed a ${(data.amount || 0).toLocaleString?.() || '0'} coin bet on ${data.team}`, {
          duration: 3000,
        });
      }
    };

    onNewBet(handleBetPlaced);
  }, [isConnected, user?.id, onNewBet]);

  // Listen for bet result events
  useEffect(() => {
    if (!isConnected || !user) return;

    const handleBetResult = (data: BetResultPayload) => {
      if (data.userId === user.id) {
        if (data.won && data.winnings !== undefined) {
          toast.success(`🎉 You won ${(data.winnings || 0).toLocaleString?.() || '0'} coins!`, {
            duration: 5000,
          });
        } else if (data.amount !== undefined) {
          toast.error(`💸 Lost ${(data.amount || 0).toLocaleString()} coins`, {
            duration: 3000,
          });
        }
      }
    };

    onBetResult(handleBetResult);
  }, [isConnected, user, onBetResult]);

  // Listen for XP gained events
  useEffect(() => {
    if (!isConnected || !user) return;

    const handleXpGained = (data: XpGainedPayload) => {
      if (data.userId === user.id) {
        toast.info(`+${data.amount} XP from ${data.source}`, {
          duration: 2000,
        });
      }
    };

    onXpGained(handleXpGained);
  }, [isConnected, user, onXpGained]);

  // Listen for level up events
  useEffect(() => {
    if (!isConnected || !user) return;

    const handleLevelUp = (data: LevelUpPayload) => {
      if (data.userId === user.id) {
        toast.success(`🎉 Level Up! You're now level ${data.newLevel}!`, {
          duration: 5000,
        });
      }
    };

    onLevelUp(handleLevelUp);
  }, [isConnected, user, onLevelUp]);

  // Listen for balance updates
  useEffect(() => {
    if (!isConnected || !user) return;

    const handleBalanceUpdated = (data: BalanceUpdatedPayload) => {
      if (data.userId === user.id) {
        updateBalance({
          coins: data.coins,
          gems: data.gems,
          xp: data.xp,
          level: data.level,
        });
      }
    };

    onBalanceUpdated(handleBalanceUpdated);
  }, [isConnected, user, updateBalance, onBalanceUpdated]);

  return {
    isConnected,
  };
}
