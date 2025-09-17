'use client';

import { Progress } from "@/components/ui/progress";
import { getLevelInfo as getNewLevelInfo, defaultXPConfig } from "@/lib/xp-config";
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
    currentLevelXP: number;
    totalXPNeeded: number;
    xpToNext: number;
    progressPercent: number;
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
            levelInfo
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
  const currentLevel = xpData?.level ?? propLevel ?? 1;
  const levelInfo = xpData?.levelInfo ?? getNewLevelInfo(currentXP, defaultXPConfig);

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
          <span className="text-primary">
            {levelInfo.xpToNext.toLocaleString()} / {levelInfo.currentLevelXP.toLocaleString()} XP
          </span>
        </div>
      )}
      {showProgress && (
        <Progress 
          value={levelInfo.progressPercent} 
          className={`h-2 ${progressClassName}`} 
        />
      )}
    </div>
  );
}
