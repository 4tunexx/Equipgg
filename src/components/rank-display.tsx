'use client';

import { getRankByLevel, getNextRank, Rank } from '../lib/badges-ranks-system';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { cn } from '../lib/utils';

interface RankDisplayProps {
  level: number;
  className?: string;
  showBenefits?: boolean;
}

export function RankDisplay({ level, className, showBenefits = false }: RankDisplayProps) {
  const rank = getRankByLevel(level);
  const nextRank = getNextRank(level);
  
  return (
    <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full', className)}
         style={{ 
           backgroundColor: `${rank.color}20`,
           border: `2px solid ${rank.color}`,
           color: rank.color
         }}>
      <span className="text-xl">{rank.icon}</span>
      <span className="font-bold">{rank.name}</span>
      {showBenefits && (
        <div className="flex items-center gap-2 ml-2 text-xs">
          {rank.benefits.dailyCoins && (
            <span>🪙 {rank.benefits.dailyCoins}/day</span>
          )}
          {rank.benefits.dailyGems && (
            <span>💎 {rank.benefits.dailyGems}/day</span>
          )}
          {rank.benefits.xpBoost && (
            <span>⚡ +{rank.benefits.xpBoost}% XP</span>
          )}
        </div>
      )}
    </div>
  );
}

interface RankCardProps {
  level: number;
  className?: string;
}

export function RankCard({ level, className }: RankCardProps) {
  const rank = getRankByLevel(level);
  const nextRank = getNextRank(level);
  const progressToNextRank = nextRank 
    ? ((level - rank.minLevel) / (nextRank.minLevel - rank.minLevel)) * 100
    : 100;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">{rank.icon}</span>
          <span style={{ color: rank.color }}>{rank.name}</span>
          <span className="text-sm text-muted-foreground ml-auto">
            Level {level}
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Rank Benefits */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Daily Benefits</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {rank.benefits.dailyCoins && (
              <div className="flex items-center gap-2">
                <span>🪙</span>
                <span>{rank.benefits.dailyCoins} Coins</span>
              </div>
            )}
            {rank.benefits.dailyGems && (
              <div className="flex items-center gap-2">
                <span>💎</span>
                <span>{rank.benefits.dailyGems} Gems</span>
              </div>
            )}
            {rank.benefits.xpBoost && (
              <div className="flex items-center gap-2">
                <span>⚡</span>
                <span>+{rank.benefits.xpBoost}% XP Boost</span>
              </div>
            )}
            {rank.benefits.crateDiscount && (
              <div className="flex items-center gap-2">
                <span>📦</span>
                <span>{rank.benefits.crateDiscount}% Crate Discount</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress to Next Rank */}
        {nextRank && (
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Next Rank</span>
              <div className="flex items-center gap-2">
                <span className="text-xl">{nextRank.icon}</span>
                <span style={{ color: nextRank.color }} className="font-semibold">
                  {nextRank.name}
                </span>
              </div>
            </div>
            <Progress value={progressToNextRank} className="h-2" />
            <div className="text-xs text-muted-foreground mt-1">
              Level {nextRank.minLevel} required ({nextRank.minLevel - level} levels to go)
            </div>
          </div>
        )}

        {!nextRank && (
          <div className="text-center py-4">
            <span className="text-2xl">👑</span>
            <p className="text-sm text-muted-foreground mt-2">
              Maximum rank achieved!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface RankBadgeProps {
  rank: Rank;
  current?: boolean;
  locked?: boolean;
  className?: string;
}

export function RankBadge({ rank, current = false, locked = false, className }: RankBadgeProps) {
  return (
    <div 
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
        current && 'ring-2 ring-offset-2',
        locked && 'opacity-50 grayscale',
        className
      )}
      style={{
        borderColor: rank.color,
        ...(current && { ringColor: rank.color })
      }}
    >
      <span className="text-4xl">{rank.icon}</span>
      <span className="font-bold" style={{ color: rank.color }}>
        {rank.name}
      </span>
      <span className="text-xs text-muted-foreground">
        Level {rank.minLevel}-{rank.maxLevel}
      </span>
      
      {current && (
        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
          Current
        </span>
      )}
      
      {locked && (
        <span className="text-xs">🔒 Locked</span>
      )}
    </div>
  );
}
