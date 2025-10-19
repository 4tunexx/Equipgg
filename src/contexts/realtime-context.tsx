'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from "../components/auth-provider";
import {
  realtimeManager,
  CHANNELS,
  EVENTS,
  type NewBetPayload,
  type XpGainedPayload,
  type LevelUpPayload,
  type BalanceUpdatedPayload,
  type BetResultPayload,
  type AchievementUnlockedPayload,
  type MissionCompletedPayload,
  type ItemAddedPayload,
  type CrateOpenedPayload,
  type ChatMessagePayload,
} from "../lib/supabase/realtime";

interface RealtimeContextType {
  isConnected: boolean;
  // Emit functions
  emitBetPlaced: (data: NewBetPayload) => Promise<void>;
  emitBetResult: (data: BetResultPayload) => Promise<void>;
  emitXpGained: (data: XpGainedPayload) => Promise<void>;
  emitLevelUp: (data: LevelUpPayload) => Promise<void>;
  emitBalanceUpdated: (data: BalanceUpdatedPayload) => Promise<void>;
  emitAchievementUnlocked: (data: AchievementUnlockedPayload) => Promise<void>;
  emitMissionCompleted: (data: MissionCompletedPayload) => Promise<void>;
  emitItemAdded: (data: ItemAddedPayload) => Promise<void>;
  emitCrateOpened: (data: CrateOpenedPayload) => Promise<void>;
  emitChatMessage: (data: ChatMessagePayload) => Promise<void>;
  // Listen functions
  onNewBet: (callback: (data: NewBetPayload) => void) => void;
  onBetResult: (callback: (data: BetResultPayload) => void) => void;
  onXpGained: (callback: (data: XpGainedPayload) => void) => void;
  onLevelUp: (callback: (data: LevelUpPayload) => void) => void;
  onBalanceUpdated: (callback: (data: BalanceUpdatedPayload) => void) => void;
  onAchievementUnlocked: (callback: (data: AchievementUnlockedPayload) => void) => void;
  onMissionCompleted: (callback: (data: MissionCompletedPayload) => void) => void;
  onItemAdded: (callback: (data: ItemAddedPayload) => void) => void;
  onCrateOpened: (callback: (data: CrateOpenedPayload) => void) => void;
  onChatMessage: (callback: (data: ChatMessagePayload) => void) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    console.log('🔌 Initializing Supabase Realtime connections...');

    // Subscribe to all channels
    const channels = [
      CHANNELS.MATCH_UPDATES,
      CHANNELS.XP_UPDATES,
      CHANNELS.INVENTORY_CHANGES,
      CHANNELS.LEADERBOARD_UPDATES,
      CHANNELS.CHAT_MESSAGES,
      CHANNELS.NOTIFICATIONS,
      CHANNELS.BETTING,
    ];

    channels.forEach(channelName => {
      realtimeManager.subscribe(channelName);
    });

    setIsConnected(true);
    console.log('✅ Supabase Realtime initialized');

    // Cleanup on unmount
    return () => {
      console.log('🔌 Cleaning up Supabase Realtime connections...');
      realtimeManager.unsubscribeAll();
      setIsConnected(false);
    };
  }, []);

  // Join user-specific room when user is available
  useEffect(() => {
    if (user?.id && isConnected) {
      console.log(`👤 User ${user.id} connected to realtime channels`);
      // User-specific subscriptions can be added here if needed
    }
  }, [user?.id, isConnected]);

  // Emit functions
  const emitBetPlaced = useCallback(async (data: NewBetPayload) => {
    await realtimeManager.broadcast(CHANNELS.BETTING, EVENTS.BET_PLACED, data);
  }, []);

  const emitBetResult = useCallback(async (data: BetResultPayload) => {
    await realtimeManager.broadcast(CHANNELS.BETTING, EVENTS.BET_RESULT, data);
  }, []);

  const emitXpGained = useCallback(async (data: XpGainedPayload) => {
    await realtimeManager.broadcast(CHANNELS.XP_UPDATES, EVENTS.XP_GAINED, data);
  }, []);

  const emitLevelUp = useCallback(async (data: LevelUpPayload) => {
    await realtimeManager.broadcast(CHANNELS.XP_UPDATES, EVENTS.LEVEL_UP, data);
  }, []);

  const emitBalanceUpdated = useCallback(async (data: BalanceUpdatedPayload) => {
    await realtimeManager.broadcast(CHANNELS.NOTIFICATIONS, EVENTS.BALANCE_UPDATED, data);
  }, []);

  const emitAchievementUnlocked = useCallback(async (data: AchievementUnlockedPayload) => {
    await realtimeManager.broadcast(CHANNELS.NOTIFICATIONS, EVENTS.ACHIEVEMENT_UNLOCKED, data);
  }, []);

  const emitMissionCompleted = useCallback(async (data: MissionCompletedPayload) => {
    await realtimeManager.broadcast(CHANNELS.NOTIFICATIONS, EVENTS.MISSION_COMPLETED, data);
  }, []);

  const emitItemAdded = useCallback(async (data: ItemAddedPayload) => {
    await realtimeManager.broadcast(CHANNELS.INVENTORY_CHANGES, EVENTS.ITEM_ADDED, data);
  }, []);

  const emitCrateOpened = useCallback(async (data: CrateOpenedPayload) => {
    await realtimeManager.broadcast(CHANNELS.INVENTORY_CHANGES, EVENTS.CRATE_OPENED, data);
  }, []);

  const emitChatMessage = useCallback(async (data: ChatMessagePayload) => {
    await realtimeManager.broadcast(CHANNELS.CHAT_MESSAGES, EVENTS.NEW_MESSAGE, data);
  }, []);

  // Listen functions
  const onNewBet = useCallback((callback: (data: NewBetPayload) => void) => {
    realtimeManager.on(CHANNELS.BETTING, EVENTS.BET_PLACED, callback);
  }, []);

  const onBetResult = useCallback((callback: (data: BetResultPayload) => void) => {
    realtimeManager.on(CHANNELS.BETTING, EVENTS.BET_RESULT, callback);
  }, []);

  const onXpGained = useCallback((callback: (data: XpGainedPayload) => void) => {
    realtimeManager.on(CHANNELS.XP_UPDATES, EVENTS.XP_GAINED, callback);
  }, []);

  const onLevelUp = useCallback((callback: (data: LevelUpPayload) => void) => {
    realtimeManager.on(CHANNELS.XP_UPDATES, EVENTS.LEVEL_UP, callback);
  }, []);

  const onBalanceUpdated = useCallback((callback: (data: BalanceUpdatedPayload) => void) => {
    realtimeManager.on(CHANNELS.NOTIFICATIONS, EVENTS.BALANCE_UPDATED, callback);
  }, []);

  const onAchievementUnlocked = useCallback((callback: (data: AchievementUnlockedPayload) => void) => {
    realtimeManager.on(CHANNELS.NOTIFICATIONS, EVENTS.ACHIEVEMENT_UNLOCKED, callback);
  }, []);

  const onMissionCompleted = useCallback((callback: (data: MissionCompletedPayload) => void) => {
    realtimeManager.on(CHANNELS.NOTIFICATIONS, EVENTS.MISSION_COMPLETED, callback);
  }, []);

  const onItemAdded = useCallback((callback: (data: ItemAddedPayload) => void) => {
    realtimeManager.on(CHANNELS.INVENTORY_CHANGES, EVENTS.ITEM_ADDED, callback);
  }, []);

  const onCrateOpened = useCallback((callback: (data: CrateOpenedPayload) => void) => {
    realtimeManager.on(CHANNELS.INVENTORY_CHANGES, EVENTS.CRATE_OPENED, callback);
  }, []);

  const onChatMessage = useCallback((callback: (data: ChatMessagePayload) => void) => {
    realtimeManager.on(CHANNELS.CHAT_MESSAGES, EVENTS.NEW_MESSAGE, callback);
  }, []);

  const value: RealtimeContextType = {
    isConnected,
    emitBetPlaced,
    emitBetResult,
    emitXpGained,
    emitLevelUp,
    emitBalanceUpdated,
    emitAchievementUnlocked,
    emitMissionCompleted,
    emitItemAdded,
    emitCrateOpened,
    emitChatMessage,
    onNewBet,
    onBetResult,
    onXpGained,
    onLevelUp,
    onBalanceUpdated,
    onAchievementUnlocked,
    onMissionCompleted,
    onItemAdded,
    onCrateOpened,
    onChatMessage,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}

// Backward compatibility alias
export const useSocket = useRealtime;
