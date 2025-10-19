'use client';

import { Badge } from '../lib/badges-ranks-system';
import { Card } from './ui/card';
import { cn } from '../lib/utils';

interface BadgeDisplayProps {
  badge: Badge;
  earned?: boolean;
  progress?: number;
  className?: string;
}

export function BadgeDisplay({ badge, earned = false, progress, className }: BadgeDisplayProps) {
  const rarityColors = {
    common: 'from-gray-500 to-gray-600',
    rare: 'from-blue-500 to-blue-600',
    epic: 'from-purple-500 to-purple-600',
    legendary: 'from-orange-500 to-orange-600'
  };

  const rarityBorders = {
    common: 'border-gray-500',
    rare: 'border-blue-500',
    epic: 'border-purple-500',
    legendary: 'border-orange-500'
  };

  return (
    <Card 
      className={cn(
        'relative overflow-hidden transition-all hover:scale-105',
        earned ? 'opacity-100' : 'opacity-50 grayscale',
        className
      )}
    >
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-10',
        rarityColors[badge.rarity]
      )} />
      
      <div className={cn(
        'border-l-4 p-4',
        rarityBorders[badge.rarity]
      )}>
        <div className="flex items-start gap-3">
          <div className="text-4xl">{badge.icon}</div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg">{badge.name}</h3>
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full uppercase font-semibold',
                badge.rarity === 'common' && 'bg-gray-500/20 text-gray-300',
                badge.rarity === 'rare' && 'bg-blue-500/20 text-blue-300',
                badge.rarity === 'epic' && 'bg-purple-500/20 text-purple-300',
                badge.rarity === 'legendary' && 'bg-orange-500/20 text-orange-300'
              )}>
                {badge.rarity}
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">
              {badge.description}
            </p>
            
            <div className="text-xs text-muted-foreground">
              {badge.requirement.description}
            </div>
            
            {badge.reward && (
              <div className="flex gap-3 mt-2 text-xs">
                {badge.reward.coins && (
                  <span className="flex items-center gap-1">
                    <span className="text-yellow-500">🪙</span>
                    {badge.reward.coins.toLocaleString()}
                  </span>
                )}
                {badge.reward.gems && (
                  <span className="flex items-center gap-1">
                    <span className="text-blue-500">💎</span>
                    {badge.reward.gems.toLocaleString()}
                  </span>
                )}
                {badge.reward.xp && (
                  <span className="flex items-center gap-1">
                    <span className="text-purple-500">⭐</span>
                    {badge.reward.xp.toLocaleString()} XP
                  </span>
                )}
              </div>
            )}
            
            {!earned && progress !== undefined && (
              <div className="mt-2">
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className={cn(
                      'h-2 rounded-full bg-gradient-to-r transition-all',
                      rarityColors[badge.rarity]
                    )}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {progress.toFixed(1)}% complete
                </div>
              </div>
            )}
            
            {earned && (
              <div className="mt-2 text-xs text-green-500 font-semibold">
                ✓ Unlocked
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

interface BadgeGridProps {
  badges: Badge[];
  earnedBadgeIds: Set<string>;
  className?: string;
}

export function BadgeGrid({ badges, earnedBadgeIds, className }: BadgeGridProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {badges.map(badge => (
        <BadgeDisplay
          key={badge.id}
          badge={badge}
          earned={earnedBadgeIds.has(badge.id)}
        />
      ))}
    </div>
  );
}
