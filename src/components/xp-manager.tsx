'use client';

import { useXP } from "../hooks/use-xp";
import { LevelUpAnimation } from "./level-up-animation";
import { XpDisplay } from "./xp-display";
import { useEffect } from 'react';

interface XPManagerProps {
  userId?: string;
  showDisplay?: boolean;
  showAnimations?: boolean;
  className?: string;
}

export function XPManager({ 
  userId, 
  showDisplay = true, 
  showAnimations = true,
  className = "" 
}: XPManagerProps) {
  const { 
    xpData, 
    isLoading, 
    error, 
    levelUpEvent, 
    clearLevelUpEvent 
  } = useXP(userId);

  // Auto-refresh XP data every 30 seconds
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      // Only refresh if not currently loading
      if (!isLoading) {
        // You could add a refresh function here if needed
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [userId, isLoading]);

  return (
    <div className={className}>
      {/* XP Display */}
      {showDisplay && (
        <XpDisplay
          xp={xpData?.xp}
          level={xpData?.level}
          userId={userId}
          autoFetch={true}
        />
      )}

      {/* Level Up Animation */}
      {showAnimations && levelUpEvent && (
        <LevelUpAnimation
          isVisible={!!levelUpEvent}
          newLevel={levelUpEvent.newLevel}
          levelsGained={levelUpEvent.levelsGained}
          rewards={levelUpEvent.rewards}
          onComplete={clearLevelUpEvent}
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="text-red-500 text-sm mt-2">
          Error: {error}
        </div>
      )}
    </div>
  );
}

// Utility functions for awarding XP from anywhere in the app
export const XPUtils = {
  // Award XP for login
  async awardLoginXP(userId: string) {
    const response = await fetch('/api/xp/award', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity_type: 'login',
        reason: 'Daily Login Bonus'
      })
    });
    return response.ok;
  },

  // Award XP for game win
  async awardGameWinXP(userId: string, gameType: string) {
    const response = await fetch('/api/xp/award', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity_type: 'game_win',
        reason: `${gameType} Game Win`
      })
    });
    return response.ok;
  },

  // Award XP for bet placement
  async awardBetXP(userId: string, betAmount: number) {
    const response = await fetch('/api/xp/award', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity_type: 'bet_placed',
        reason: 'Bet Placed'
      })
    });
    return response.ok;
  },

  // Award XP for mission completion
  async awardMissionXP(userId: string, missionName: string) {
    const response = await fetch('/api/xp/award', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity_type: 'mission_complete',
        reason: `Mission Completed: ${missionName}`
      })
    });
    return response.ok;
  },

  // Award custom XP
  async awardCustomXP(userId: string, amount: number, reason: string, source: string = 'custom') {
    const response = await fetch('/api/xp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        reason,
        source
      })
    });
    return response.ok;
  }
};
