'use client';

import { getXpProgress, getXpForLevel } from '../lib/xp-leveling-system';
import { Progress } from './ui/progress';
import { Card, CardContent } from './ui/card';
import { cn } from '../lib/utils';

interface XpProgressBarProps {
  totalXp: number;
  className?: string;
  showDetails?: boolean;
}

export function XpProgressBar({ totalXp, className, showDetails = true }: XpProgressBarProps) {
  const { level, currentLevelXp, xpForNextLevel, progress } = getXpProgress(totalXp);

  return (
    <div className={cn('space-y-2', className)}>
      {showDetails && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">⭐</span>
            <span className="font-semibold">Level {level}</span>
          </div>
          <span className="text-muted-foreground">
            {currentLevelXp.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
          </span>
        </div>
      )}
      
      <div className="relative">
        <Progress value={progress} className="h-3" />
        <div 
          className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-difference"
        >
          {progress.toFixed(1)}%
        </div>
      </div>
      
      {showDetails && (
        <div className="text-xs text-muted-foreground">
          {(xpForNextLevel - currentLevelXp).toLocaleString()} XP to Level {level + 1}
        </div>
      )}
    </div>
  );
}

interface XpCardProps {
  totalXp: number;
  className?: string;
}

export function XpCard({ totalXp, className }: XpCardProps) {
  const { level, currentLevelXp, xpForNextLevel, progress } = getXpProgress(totalXp);

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-3xl">⭐</span>
                <h3 className="text-2xl font-bold">Level {level}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {totalXp.toLocaleString()} Total XP
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Next Level</div>
              <div className="text-xl font-bold">{level + 1}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">
                {currentLevelXp.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
              </span>
            </div>
            
            <div className="relative">
              <Progress value={progress} className="h-4" />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-difference">
                {progress.toFixed(1)}%
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground text-center">
              {(xpForNextLevel - currentLevelXp).toLocaleString()} XP remaining
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface XpGainNotificationProps {
  amount: number;
  source: string;
  levelUp?: boolean;
  newLevel?: number;
}

export function XpGainNotification({ amount, source, levelUp, newLevel }: XpGainNotificationProps) {
  if (levelUp && newLevel) {
    return (
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/50 rounded-lg">
        <span className="text-4xl">🎉</span>
        <div>
          <div className="font-bold text-lg">Level Up!</div>
          <div className="text-sm text-muted-foreground">
            You reached Level {newLevel}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
      <span className="text-2xl">⭐</span>
      <div>
        <div className="font-semibold">+{amount} XP</div>
        <div className="text-xs text-muted-foreground">{source}</div>
      </div>
    </div>
  );
}
