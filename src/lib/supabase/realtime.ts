/**
 * Supabase Realtime Channel Manager
 * Replaces Socket.IO with Supabase Realtime for all real-time features
 */

import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './client';

// Channel names
export const CHANNELS = {
  MATCH_UPDATES: 'match_updates',
  XP_UPDATES: 'xp_updates',
  INVENTORY_CHANGES: 'inventory_changes',
  LEADERBOARD_UPDATES: 'leaderboard_updates',
  CHAT_MESSAGES: 'chat_messages',
  NOTIFICATIONS: 'notifications',
  BETTING: 'betting',
} as const;

// Event types for each channel
export const EVENTS = {
  // Match updates
  MATCH_RESULT: 'match_result',
  NEW_BET: 'new_bet',
  ODDS_UPDATE: 'odds_update',
  
  // XP updates
  XP_GAINED: 'xp_gained',
  LEVEL_UP: 'level_up',
  
  // Inventory changes
  ITEM_ADDED: 'item_added',
  ITEM_REMOVED: 'item_removed',
  CRATE_OPENED: 'crate_opened',
  
  // Leaderboard updates
  RANK_CHANGED: 'rank_changed',
  NEW_LEADER: 'new_leader',
  
  // Chat messages
  NEW_MESSAGE: 'new_message',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  
  // Notifications
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  MISSION_COMPLETED: 'mission_completed',
  SYSTEM_ALERT: 'system_alert',
  BALANCE_UPDATED: 'balance_updated',
  BET_PLACED: 'bet_placed',
  BET_RESULT: 'bet_result',
} as const;

// Type definitions for event payloads
export interface MatchResultPayload {
  matchId: string;
  winner: string;
  team1Score: number;
  team2Score: number;
  timestamp: string;
}

export interface NewBetPayload {
  userId: string;
  username: string;
  matchId: string;
  team: string;
  amount: number;
  odds?: number;
  timestamp: string;
}

export interface XpGainedPayload {
  userId: string;
  amount: number;
  source: string;
  newTotal: number;
  timestamp: string;
}

export interface LevelUpPayload {
  userId: string;
  newLevel: number;
  xp: number;
  rewards?: {
    coins?: number;
    gems?: number;
    items?: string[];
  };
  timestamp: string;
}

export interface ItemAddedPayload {
  userId: string;
  itemId: string;
  itemName: string;
  rarity: string;
  source: string;
  timestamp: string;
}

export interface CrateOpenedPayload {
  userId: string;
  crateId: string;
  crateName: string;
  items: Array<{
    id: string;
    name: string;
    rarity: string;
    value: number;
  }>;
  timestamp: string;
}

export interface AchievementUnlockedPayload {
  userId: string;
  achievementId: string;
  achievementName: string;
  description: string;
  xpReward: number;
  timestamp: string;
}

export interface MissionCompletedPayload {
  userId: string;
  missionId: string;
  missionName: string;
  xpReward: number;
  coinReward?: number;
  timestamp: string;
}

export interface BalanceUpdatedPayload {
  userId: string;
  coins: number;
  gems: number;
  xp: number;
  level: number;
  timestamp: string;
}

export interface BetResultPayload {
  betId: string;
  userId: string;
  matchId: string;
  won: boolean;
  amount: number;
  winnings: number;
  timestamp: string;
}

export interface ChatMessagePayload {
  id: string;
  channelId: string;
  userId: string;
  username: string;
  avatar?: string;
  message: string;
  timestamp: string;
}

// Realtime Manager Class
export class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private isConnected: boolean = false;

  /**
   * Subscribe to a channel
   */
  subscribe(channelName: string): RealtimeChannel {
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = supabase.channel(channelName);
    this.channels.set(channelName, channel);

    channel
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed to channel: ${channelName}`);
          this.isConnected = true;
        } else if (status === 'CHANNEL_ERROR') {
          console.warn(`⚠️ Realtime not enabled for channel: ${channelName} - Enable Realtime in Supabase dashboard for live updates`);
          this.isConnected = false;
          // Don't throw error - app will work without realtime
        } else if (status === 'TIMED_OUT') {
          console.warn(`⏰ Subscription timeout for channel: ${channelName}`);
          this.isConnected = false;
        } else if (status === 'CLOSED') {
          console.log(`🔌 Channel closed: ${channelName}`);
          this.isConnected = false;
        }
      });

    return channel;
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channelName: string): Promise<void> {
    const channel = this.channels.get(channelName);
    if (channel) {
      await supabase.removeChannel(channel);
      this.channels.delete(channelName);
      console.log(`🔌 Unsubscribed from channel: ${channelName}`);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  async unsubscribeAll(): Promise<void> {
    for (const [channelName, channel] of this.channels.entries()) {
      await supabase.removeChannel(channel);
      console.log(`🔌 Unsubscribed from channel: ${channelName}`);
    }
    this.channels.clear();
    this.isConnected = false;
  }

  /**
   * Broadcast an event to a channel
   */
  async broadcast<T = any>(
    channelName: string,
    eventName: string,
    payload: T
  ): Promise<'ok' | 'timed out' | 'rate limited' | 'error'> {
    let channel = this.channels.get(channelName);
    
    if (!channel) {
      channel = this.subscribe(channelName);
    }

    const result = await channel.send({
      type: 'broadcast',
      event: eventName,
      payload,
    });

    return result;
  }

  /**
   * Listen to broadcast events on a channel
   */
  on<T = any>(
    channelName: string,
    eventName: string,
    callback: (payload: T) => void
  ): RealtimeChannel {
    let channel = this.channels.get(channelName);
    
    if (!channel) {
      channel = this.subscribe(channelName);
    }

    channel.on('broadcast', { event: eventName }, ({ payload }) => {
      callback(payload as T);
    });

    return channel;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get a specific channel
   */
  getChannel(channelName: string): RealtimeChannel | undefined {
    return this.channels.get(channelName);
  }
}

// Global singleton instance
export const realtimeManager = new RealtimeManager();

// Convenience functions for common operations

/**
 * Broadcast a match result
 */
export async function broadcastMatchResult(payload: MatchResultPayload) {
  return realtimeManager.broadcast(
    CHANNELS.MATCH_UPDATES,
    EVENTS.MATCH_RESULT,
    payload
  );
}

/**
 * Broadcast a new bet
 */
export async function broadcastNewBet(payload: NewBetPayload) {
  return realtimeManager.broadcast(
    CHANNELS.BETTING,
    EVENTS.NEW_BET,
    payload
  );
}

/**
 * Broadcast XP gained
 */
export async function broadcastXpGained(payload: XpGainedPayload) {
  return realtimeManager.broadcast(
    CHANNELS.XP_UPDATES,
    EVENTS.XP_GAINED,
    payload
  );
}

/**
 * Broadcast level up
 */
export async function broadcastLevelUp(payload: LevelUpPayload) {
  return realtimeManager.broadcast(
    CHANNELS.XP_UPDATES,
    EVENTS.LEVEL_UP,
    payload
  );
}

/**
 * Broadcast item added to inventory
 */
export async function broadcastItemAdded(payload: ItemAddedPayload) {
  return realtimeManager.broadcast(
    CHANNELS.INVENTORY_CHANGES,
    EVENTS.ITEM_ADDED,
    payload
  );
}

/**
 * Broadcast crate opened
 */
export async function broadcastCrateOpened(payload: CrateOpenedPayload) {
  return realtimeManager.broadcast(
    CHANNELS.INVENTORY_CHANGES,
    EVENTS.CRATE_OPENED,
    payload
  );
}

/**
 * Broadcast achievement unlocked
 */
export async function broadcastAchievementUnlocked(payload: AchievementUnlockedPayload) {
  return realtimeManager.broadcast(
    CHANNELS.NOTIFICATIONS,
    EVENTS.ACHIEVEMENT_UNLOCKED,
    payload
  );
}

/**
 * Broadcast mission completed
 */
export async function broadcastMissionCompleted(payload: MissionCompletedPayload) {
  return realtimeManager.broadcast(
    CHANNELS.NOTIFICATIONS,
    EVENTS.MISSION_COMPLETED,
    payload
  );
}

/**
 * Broadcast balance updated
 */
export async function broadcastBalanceUpdated(payload: BalanceUpdatedPayload) {
  return realtimeManager.broadcast(
    CHANNELS.NOTIFICATIONS,
    EVENTS.BALANCE_UPDATED,
    payload
  );
}

/**
 * Broadcast bet result
 */
export async function broadcastBetResult(payload: BetResultPayload) {
  return realtimeManager.broadcast(
    CHANNELS.BETTING,
    EVENTS.BET_RESULT,
    payload
  );
}

/**
 * Broadcast chat message
 */
export async function broadcastChatMessage(payload: ChatMessagePayload) {
  return realtimeManager.broadcast(
    CHANNELS.CHAT_MESSAGES,
    EVENTS.NEW_MESSAGE,
    payload
  );
}
