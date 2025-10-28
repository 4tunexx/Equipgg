/**
 * SUPABASE REALTIME CLIENT
 * Handles all real-time subscriptions and broadcasts
 * Compatible with Vercel deployment
 */

import { RealtimeChannel, RealtimeClient } from '@supabase/realtime-js';
import { supabase } from '../supabase';

export type RealtimeEvent = 
  | 'xp_update'
  | 'level_up'
  | 'balance_update'
  | 'mission_complete'
  | 'achievement_unlock'
  | 'crate_opened'
  | 'item_received'
  | 'match_update'
  | 'bet_placed'
  | 'chat_message'
  | 'notification'
  | 'user_online'
  | 'user_offline';

interface RealtimePayload {
  type: RealtimeEvent;
  userId: string;
  data: any;
  timestamp: number;
}

class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private listeners: Map<string, Set<(payload: any) => void>> = new Map();
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private async initialize() {
    try {
      // Check if Supabase is configured
      if (!supabase) {
        console.warn('Supabase not configured, skipping realtime initialization');
        return;
      }

      this.setupGlobalChannel();
      this.setupUserChannels();
      this.connectionStatus = 'connected';
      console.log('✅ Realtime Manager initialized');
    } catch (error) {
      console.error('Failed to initialize realtime:', error);
      this.scheduleReconnect();
    }
  }

  private setupGlobalChannel() {
    // Global channel for all users (public events)
    const globalChannel = supabase
      .channel('global')
      .on('broadcast', { event: 'activity' }, (payload) => {
        this.handleBroadcast('activity', payload);
      })
      .on('broadcast', { event: 'match_update' }, (payload) => {
        this.handleBroadcast('match_update', payload);
      })
      .on('broadcast', { event: 'leaderboard_update' }, (payload) => {
        this.handleBroadcast('leaderboard_update', payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to global channel');
        }
      });

    this.channels.set('global', globalChannel);
  }

  private setupUserChannels() {
    // Get current user ID from session
    const userId = this.getCurrentUserId();
    if (!userId) return;

    // Personal channel for user-specific events
    const userChannel = supabase
      .channel(`user:${userId}`)
      .on('broadcast', { event: 'xp_update' }, (payload) => {
        this.handleBroadcast('xp_update', payload);
      })
      .on('broadcast', { event: 'level_up' }, (payload) => {
        this.handleBroadcast('level_up', payload);
      })
      .on('broadcast', { event: 'balance_update' }, (payload) => {
        this.handleBroadcast('balance_update', payload);
      })
      .on('broadcast', { event: 'mission_complete' }, (payload) => {
        this.handleBroadcast('mission_complete', payload);
      })
      .on('broadcast', { event: 'achievement_unlock' }, (payload) => {
        this.handleBroadcast('achievement_unlock', payload);
      })
      .on('broadcast', { event: 'item_received' }, (payload) => {
        this.handleBroadcast('item_received', payload);
      })
      .on('broadcast', { event: 'notification' }, (payload) => {
        this.handleBroadcast('notification', payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed to user channel: ${userId}`);
        }
      });

    this.channels.set(`user:${userId}`, userChannel);

    // Subscribe to database changes for real-time updates
    this.subscribeToTableChanges(userId);
  }

  private subscribeToTableChanges(userId: string) {
    // Listen to user table changes
    const userChanges = supabase
      .channel('user-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          this.handleDatabaseChange('user_update', payload);
        }
      )
      .subscribe();

    this.channels.set('user-changes', userChanges);

    // Listen to notifications table
    const notificationChanges = supabase
      .channel('notification-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          this.handleDatabaseChange('new_notification', payload);
        }
      )
      .subscribe();

    this.channels.set('notification-changes', notificationChanges);

    // Listen to inventory changes
    const inventoryChanges = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_inventory',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          this.handleDatabaseChange('inventory_update', payload);
        }
      )
      .subscribe();

    this.channels.set('inventory-changes', inventoryChanges);
  }

  private getCurrentUserId(): string | null {
    // Try to get user ID from session cookie
    if (typeof window !== 'undefined') {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'equipgg_user_id') {
          return value;
        }
      }
    }
    return null;
  }

  private handleBroadcast(event: string, payload: any) {
    console.log(`📡 Broadcast received: ${event}`, payload);
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(payload));
    }
  }

  private handleDatabaseChange(event: string, payload: any) {
    console.log(`🔄 Database change: ${event}`, payload);
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(payload));
    }
  }

  // Public API

  public subscribe(event: string, callback: (payload: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(event);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  public async broadcast(channel: string, event: RealtimeEvent, data: any) {
    try {
      const channelInstance = this.channels.get(channel) || this.channels.get('global');
      if (channelInstance) {
        await channelInstance.send({
          type: 'broadcast',
          event,
          payload: {
            type: event,
            userId: this.getCurrentUserId(),
            data,
            timestamp: Date.now()
          }
        });
        console.log(`📤 Broadcast sent: ${event} on ${channel}`);
      }
    } catch (error) {
      console.error('Failed to broadcast:', error);
    }
  }

  public async broadcastToUser(userId: string, event: RealtimeEvent, data: any) {
    await this.broadcast(`user:${userId}`, event, data);
  }

  public async broadcastGlobal(event: RealtimeEvent, data: any) {
    await this.broadcast('global', event, data);
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.initialize();
    }, delay);
  }

  public disconnect() {
    // Unsubscribe from all channels
    this.channels.forEach((channel) => {
      channel.unsubscribe();
    });
    this.channels.clear();
    this.listeners.clear();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.connectionStatus = 'disconnected';
    console.log('🔌 Realtime disconnected');
  }

  public getStatus() {
    return this.connectionStatus;
  }
}

// Create singleton instance
export const realtimeManager = new RealtimeManager();

// Helper functions for common broadcasts
export async function broadcastXPUpdate(userId: string, xp: number, level: number) {
  await realtimeManager.broadcastToUser(userId, 'xp_update', { xp, level });
}

export async function broadcastLevelUp(userId: string, newLevel: number, rewards: any) {
  await realtimeManager.broadcastToUser(userId, 'level_up', { level: newLevel, rewards });
  await realtimeManager.broadcastGlobal('level_up', { userId, level: newLevel });
}

export async function broadcastBalanceUpdate(userId: string, coins: number, gems: number) {
  await realtimeManager.broadcastToUser(userId, 'balance_update', { coins, gems });
}

export async function broadcastMissionComplete(userId: string, missionId: string, rewards: any) {
  await realtimeManager.broadcastToUser(userId, 'mission_complete', { missionId, rewards });
}

export async function broadcastAchievementUnlock(userId: string, achievementId: string, achievement: any) {
  await realtimeManager.broadcastToUser(userId, 'achievement_unlock', { achievementId, achievement });
  await realtimeManager.broadcastGlobal('achievement_unlock', { userId, achievement });
}

export async function broadcastCrateOpened(userId: string, crateId: number, item: any) {
  await realtimeManager.broadcastToUser(userId, 'crate_opened', { crateId, item });
  await realtimeManager.broadcastGlobal('crate_opened', { userId, item });
}

export async function broadcastItemReceived(userId: string, item: any) {
  await realtimeManager.broadcastToUser(userId, 'item_received', { item });
}

export async function broadcastMatchUpdate(matchId: string, update: any) {
  await realtimeManager.broadcastGlobal('match_update', { matchId, ...update });
}

export async function broadcastBetPlaced(userId: string, bet: any) {
  await realtimeManager.broadcastToUser(userId, 'bet_placed', { bet });
  await realtimeManager.broadcastGlobal('bet_placed', { userId, bet });
}

export async function broadcastChatMessage(channel: string, message: any) {
  await realtimeManager.broadcastGlobal('chat_message', { channel, message });
}

export async function broadcastNotification(userId: string, notification: any) {
  await realtimeManager.broadcastToUser(userId, 'notification', notification);
}

// Export for use in components
export default realtimeManager;

// Export global broadcast function
export const broadcastGlobal = async (event: RealtimeEvent, data: any) => {
  await realtimeManager.broadcastGlobal(event, data);
};
