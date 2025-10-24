'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { realtimeManager, RealtimeEvent } from '../lib/supabase/realtime-client';
import { useAuth } from '../hooks/use-auth';
import { useToast } from '../hooks/use-toast';
import { LevelUpAnimation } from '../components/level-up-animation';

interface RealtimeContextType {
  isConnected: boolean;
  subscribe: (event: string, callback: (payload: any) => void) => () => void;
  broadcast: (event: RealtimeEvent, data: any) => void;
  lastXPUpdate: { xp: number; level: number } | null;
  lastBalanceUpdate: { coins: number; gems: number } | null;
  lastNotification: any | null;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState<any>(null);
  const [lastXPUpdate, setLastXPUpdate] = useState<{ xp: number; level: number } | null>(null);
  const [lastBalanceUpdate, setLastBalanceUpdate] = useState<{ coins: number; gems: number } | null>(null);
  const [lastNotification, setLastNotification] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;

    // Subscribe to user-specific events
    const unsubscribers: (() => void)[] = [];

    // XP Updates
    unsubscribers.push(
      realtimeManager.subscribe('xp_update', (payload) => {
        console.log('📊 XP Update received:', payload);
        setLastXPUpdate(payload.data);
      })
    );

    // Level Up
    unsubscribers.push(
      realtimeManager.subscribe('level_up', (payload) => {
        console.log('🎉 Level Up!', payload);
        setLevelUpData(payload.data);
        setShowLevelUp(true);
        
        toast({
          title: "🎉 Level Up!",
          description: `Congratulations! You've reached level ${payload.data.level}!`,
          duration: 5000,
        });
      })
    );

    // Balance Updates
    unsubscribers.push(
      realtimeManager.subscribe('balance_update', (payload) => {
        console.log('💰 Balance Update:', payload);
        setLastBalanceUpdate(payload.data);
      })
    );

    // Mission Complete
    unsubscribers.push(
      realtimeManager.subscribe('mission_complete', (payload) => {
        console.log('✅ Mission Complete:', payload);
        toast({
          title: "✅ Mission Complete!",
          description: `You've completed a mission and earned rewards!`,
          duration: 4000,
        });
      })
    );

    // Achievement Unlock
    unsubscribers.push(
      realtimeManager.subscribe('achievement_unlock', (payload) => {
        console.log('🏆 Achievement Unlocked:', payload);
        toast({
          title: "🏆 Achievement Unlocked!",
          description: payload.data.achievement.name,
          duration: 5000,
        });
      })
    );

    // Crate Opened
    unsubscribers.push(
      realtimeManager.subscribe('crate_opened', (payload) => {
        console.log('📦 Crate Opened:', payload);
        // Handled by crate opening animation
      })
    );

    // Item Received
    unsubscribers.push(
      realtimeManager.subscribe('item_received', (payload) => {
        console.log('🎁 Item Received:', payload);
        toast({
          title: "🎁 New Item!",
          description: `You received: ${payload.data.item.name}`,
          duration: 4000,
        });
      })
    );

    // Notifications
    unsubscribers.push(
      realtimeManager.subscribe('notification', (payload) => {
        console.log('🔔 Notification:', payload);
        setLastNotification(payload.data);
        
        // Show toast for important notifications
        if (payload.data.priority === 'high') {
          toast({
            title: payload.data.title || "Notification",
            description: payload.data.message,
            duration: 5000,
          });
        }
      })
    );

    // Database change listeners
    unsubscribers.push(
      realtimeManager.subscribe('user_update', (payload) => {
        console.log('👤 User data updated:', payload);
        // Trigger user data refresh
        window.dispatchEvent(new Event('user-data-updated'));
      })
    );

    unsubscribers.push(
      realtimeManager.subscribe('inventory_update', (payload) => {
        console.log('📦 Inventory updated:', payload);
        // Trigger inventory refresh
        window.dispatchEvent(new Event('inventory-updated'));
      })
    );

    unsubscribers.push(
      realtimeManager.subscribe('new_notification', (payload) => {
        console.log('🔔 New notification:', payload);
        // Trigger notification bell update
        window.dispatchEvent(new Event('notification-received'));
      })
    );

    setIsConnected(realtimeManager.getStatus() === 'connected');

    // Cleanup
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user, toast]);

  const subscribe = useCallback(
    (event: string, callback: (payload: any) => void) => {
      return realtimeManager.subscribe(event, callback);
    },
    []
  );

  const broadcast = useCallback(
    (event: RealtimeEvent, data: any) => {
      realtimeManager.broadcastGlobal(event, data);
    },
    []
  );

  return (
    <RealtimeContext.Provider 
      value={{ 
        isConnected, 
        subscribe, 
        broadcast,
        lastXPUpdate,
        lastBalanceUpdate,
        lastNotification
      }}
    >
      {children}
      
      {/* Level Up Animation Overlay */}
      {showLevelUp && levelUpData && (
        <LevelUpAnimation
          isVisible={showLevelUp}
          newLevel={levelUpData.level}
          levelsGained={1}
          rewards={levelUpData.rewards}
          onComplete={() => {
            setShowLevelUp(false);
            setLevelUpData(null);
          }}
        />
      )}
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

// Helper hook for subscribing to specific events
export function useRealtimeEvent(
  event: string,
  callback: (payload: any) => void,
  deps: React.DependencyList = []
) {
  const { subscribe } = useRealtime();
  
  useEffect(() => {
    const unsubscribe = subscribe(event, callback);
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// Helper hook for balance updates
export function useRealtimeBalance() {
  const { lastBalanceUpdate } = useRealtime();
  return lastBalanceUpdate;
}

// Helper hook for XP updates
export function useRealtimeXP() {
  const { lastXPUpdate } = useRealtime();
  return lastXPUpdate;
}

// Helper hook for notifications
export function useRealtimeNotifications() {
  const { lastNotification } = useRealtime();
  return lastNotification;
}
