'use client';

import { useState, useEffect, useCallback } from 'react';
import { addXP, getUserXPInfo } from "../lib/xp-service";

interface XPData {
  xp: number;
  level: number;
  levelInfo: {
    level: number;
    currentLevelXP: number;
    totalXPNeeded: number;
    xpToNext: number;
    progressPercent: number;
  };
}

interface LevelUpEvent {
  newLevel: number;
  levelsGained: number;
  rewards: {
    coins: number;
    keys: number;
  };
}

export function useXP(userId?: string) {
  const [xpData, setXpData] = useState<XPData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [levelUpEvent, setLevelUpEvent] = useState<LevelUpEvent | null>(null);

  // Fetch XP data
  const fetchXPData = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/xp', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setXpData({
            xp: data.xp,
            level: data.level,
            levelInfo: data.levelInfo
          });
        } else {
          setError('Failed to fetch XP data');
        }
      } else {
        setError('Failed to fetch XP data');
      }
    } catch (err) {
      setError('Network error');
      console.error('Failed to fetch XP data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Add XP to user
  const awardXP = useCallback(async (
    amount: number,
    source: string,
    reason: string = 'XP Award'
  ) => {
    if (!userId || amount <= 0) return false;

    try {
      const response = await fetch('/api/xp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          source,
          reason
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update local state
          setXpData({
            xp: data.newXP,
            level: data.newLevel,
            levelInfo: data.levelInfo
          });

          // Trigger level up animation if leveled up
          if (data.leveledUp) {
            setLevelUpEvent({
              newLevel: data.newLevel,
              levelsGained: data.levelsGained,
              rewards: {
                coins: data.levelsGained * 200, // 200 coins per level
                keys: data.levelsGained
              }
            });
          }

          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Failed to award XP:', err);
      return false;
    }
  }, [userId]);

  // Award XP using the award endpoint (with perks and coins)
  const awardRewards = useCallback(async (
    xp?: number,
    coins?: number,
    activityType?: string,
    reason: string = 'Reward'
  ) => {
    if (!userId) return false;

    try {
      const response = await fetch('/api/xp/award', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          xp,
          coins,
          activity_type: activityType,
          reason
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update local state
          setXpData({
            xp: data.newXp,
            level: data.newLevel,
            levelInfo: data.levelInfo
          });

          // Trigger level up animation if leveled up
          if (data.leveledUp) {
            setLevelUpEvent({
              newLevel: data.newLevel,
              levelsGained: data.levelsGained,
              rewards: {
                coins: data.levelUpBonus || 0,
                keys: data.levelsGained
              }
            });
          }

          return {
            success: true,
            xpAwarded: data.xpAwarded,
            coinsAwarded: data.coinsAwarded,
            leveledUp: data.leveledUp,
            levelsGained: data.levelsGained
          };
        }
      }
      return { success: false };
    } catch (err) {
      console.error('Failed to award rewards:', err);
      return { success: false };
    }
  }, [userId]);

  // Clear level up event (called after animation completes)
  const clearLevelUpEvent = useCallback(() => {
    setLevelUpEvent(null);
  }, []);

  // Refresh XP data
  const refresh = useCallback(() => {
    fetchXPData();
  }, [fetchXPData]);

  // Initial fetch
  useEffect(() => {
    fetchXPData();
  }, [fetchXPData]);

  return {
    xpData,
    isLoading,
    error,
    levelUpEvent,
    awardXP,
    awardRewards,
    clearLevelUpEvent,
    refresh
  };
}
