'use client';

import { Progress } from "./ui/progress";
import { getLevelInfo as getNewLevelInfo, getLevelFromXP, getXPForLevel, defaultXPConfig } from "../lib/xp-config";
import { useState, useEffect } from "react";

interface XpDisplayProps {
  xp?: number;
  level?: number;
  userId?: string;
  showProgress?: boolean;
  showText?: boolean;
  className?: string;
  progressClassName?: string;
  autoFetch?: boolean;
}

interface XPData {
  xp: number;
  level: number;
  levelInfo: {
    level: number;
    currentLevel?: number;
    currentLevelXP: number;
    totalXPNeeded: number;
    xpToNext: number;
    progressPercent: number;
    // Additional fields from API
    currentXP?: number;
    xpForNextLevel?: number;
    xpProgress?: number;
    totalXPForNextLevel?: number;
  };
}

export function XpDisplay({ 
  xp: propXp, 
  level: propLevel, 
  userId,
  showProgress = true, 
  showText = true, 
  className = "",
  progressClassName = "",
  autoFetch = false
}: XpDisplayProps) {
  const [xpData, setXpData] = useState<XPData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch XP data from API if autoFetch is enabled or if no XP data is provided
  useEffect(() => {
    const fetchXPData = async () => {
      if (!autoFetch && (propXp !== undefined && propLevel !== undefined)) {
        // Use provided data
        const levelInfo = getNewLevelInfo(propXp, defaultXPConfig);
        setXpData({
          xp: propXp,
          level: propLevel,
          levelInfo
        });
        return;
      }

      if (!userId) return;

      setIsLoading(true);
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
          }
        }
      } catch (error) {
        console.error('Failed to fetch XP data:', error);
        // Fallback to provided data or default
        if (propXp !== undefined && propLevel !== undefined) {
          const levelInfo = getNewLevelInfo(propXp, defaultXPConfig);
          setXpData({
            xp: propXp,
            level: propLevel,
            levelInfo: {
              ...levelInfo,
              currentXP: Math.max(0, propXp - levelInfo.totalXPNeeded),
              totalXPForNextLevel: levelInfo.currentLevelXP
            }
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchXPData();
  }, [userId, autoFetch, propXp, propLevel]);

  // Use fetched data or fallback to provided props  
  const currentXP = xpData?.xp ?? propXp ?? 0;
  // Always calculate level from XP to ensure consistency
  const currentLevel = xpData?.level ?? getLevelFromXP(currentXP) ?? 1;
  const levelInfo = xpData?.levelInfo ?? getNewLevelInfo(currentXP, defaultXPConfig);

  // Use the correct fields from the API response or calculate locally
  // For level progression display, we want to show progress toward NEXT level
  const xpEarnedThisLevel = Math.max(0, currentXP - levelInfo.totalXPNeeded);
  
  // Calculate XP needed for NEXT level (not current level)
  const nextLevelTotalXP = getXPForLevel(currentLevel + 1, defaultXPConfig);
  const xpNeededForNextLevel = nextLevelTotalXP - levelInfo.totalXPNeeded;
  const safeXpNeededForNext = xpNeededForNextLevel > 0 ? xpNeededForNextLevel : 1;
  const safeXpEarned = Math.max(0, xpEarnedThisLevel);
  
  // Calculate progress percentage manually to ensure it's correct
  const progressPercent = safeXpNeededForNext > 0 
    ? Math.min(100, Math.max(0, (safeXpEarned / safeXpNeededForNext) * 100))
    : 0;
  
  console.log('XP Display Debug:', {
    currentXP,
    currentLevel,
    totalXPNeeded: levelInfo.totalXPNeeded,
    nextLevelTotalXP,
    xpEarnedThisLevel: safeXpEarned,
    xpNeededForNextLevel: safeXpNeededForNext,
    progressPercent,
    levelInfo
  });

  if (isLoading) {
    return (
      <div className={className}>
        {showText && (
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span>Level {currentLevel}</span>
            <span className="text-primary">Loading...</span>
          </div>
        )}
        {showProgress && (
          <Progress 
            value={0} 
            className={`h-2 ${progressClassName}`} 
          />
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {showText && (
        <div className="flex justify-between text-xs font-semibold mb-1">
          <span>Level {currentLevel}</span>
          <span className="text-orange-500">
            {safeXpEarned.toLocaleString?.() || '0'} / {safeXpNeededForNext.toLocaleString?.() || '1'} XP
          </span>
        </div>
      )}
      {showProgress && (
        <Progress 
          value={progressPercent} 
          variant="xp"
          className={`h-2 ${progressClassName}`} 
        />
      )}
    </div>
  );
}
