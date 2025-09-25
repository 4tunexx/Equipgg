
'use client';

import { cn } from "../lib/utils";
import type { Rarity } from "../lib/supabase/queries";

// Define utility constants locally
const rarityColors: Record<Rarity, string> = {
  'Common': 'text-gray-500',
  'Uncommon': 'text-green-500',
  'Rare': 'text-blue-500',
  'Epic': 'text-purple-500',
  'Legendary': 'text-yellow-500'
};
import { UserProfileLink } from "./user-profile-link";
import React, { useEffect, useState } from "react";
import { Gem, Trophy as TrophyIcon, Award as AwardIcon, Crown as CrownIcon, Zap as ZapIcon, MessageSquare as MessageSquareIcon } from 'lucide-react';

interface Activity {
  id: string;
  type: 'bet' | 'win' | 'crate' | 'trade' | 'achievement';
  message: string;
  amount?: number;
  item?: string;
  timestamp: string;
  user: {
    username: string;
    avatar: string;
    role?: string;
    xp?: number;
    level?: number;
    isVip?: boolean;
  };
}

interface User {
  rank: number;
  name: string;
  avatar: string;
  dataAiHint: string;
  xp: number;
  role?: string;
}

export function PrestigeActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fallbackUsers: Record<string, User> = {
    'john325': { rank: 1, name: 'john325', avatar: 'https://picsum.photos/40/40?random=1', dataAiHint: "gamer avatar", xp: 1250320, role: 'admin' },
    'copilot32': { rank: 2, name: 'copilot32', avatar: 'https://picsum.photos/40/40?random=2', dataAiHint: "gaming profile", xp: 1198750, role: 'moderator' },
    'PixelWarrior': { rank: 3, name: 'PixelWarrior', avatar: 'https://picsum.photos/40/40?random=3', dataAiHint: "user avatar", xp: 1150600, role: 'user' },
    'NIGHTRAGE': { rank: 4, name: 'NIGHTRAGE', avatar: 'https://picsum.photos/40/40?random=4', dataAiHint: "gaming avatar", xp: 1099800, role: 'user' },
    'HydraX': { rank: 5, name: 'HydraX', avatar: 'https://picsum.photos/40/40?random=5', dataAiHint: "player avatar", xp: 1056240, role: 'user' },
    'ShadowStrike': { rank: 1, name: 'ShadowStrike', avatar: 'https://picsum.photos/40/40?random=21', dataAiHint: "gamer avatar", xp: 1250320, role: 'user' },
    'Vortex': { rank: 2, name: 'Vortex', avatar: 'https://picsum.photos/40/40?random=22', dataAiHint: "gaming profile", xp: 1198750, role: 'user' },
    'Phoenix': { rank: 3, name: 'Phoenix', avatar: 'https://picsum.photos/40/40?random=23', dataAiHint: "user avatar", xp: 1150600, role: 'user' },
    'Reaper': { rank: 4, name: 'Reaper', avatar: 'https://picsum.photos/40/40?random=24', dataAiHint: "gaming avatar", xp: 1099800, role: 'user' },
    'Fury': { rank: 5, name: 'Fury', avatar: 'https://picsum.photos/40/40?random=25', dataAiHint: "player avatar", xp: 1056240, role: 'user' },
  };

  const iconFromName = (type?: string) => {
    switch (type) {
      case 'win': return TrophyIcon;
      case 'bet': return ZapIcon;
      case 'crate': return Gem;
      case 'trade': return AwardIcon;
      case 'achievement': return CrownIcon;
      default: return Gem;
    }
  };

  // Fallback activities for when API fails
    const generateFallbackActivities = (): Activity[] => {
      const gameTypes = ['coinflip', 'roulette', 'crash', 'slots', 'jackpot'];
      const items = [
        'AK-47 | Redline',
        'AWP | Dragon Lore', 
        'Karambit | Fade',
        'M4A4 | Howl',
        'Bayonet | Crimson Web'
      ];
      const usernames = ['CsGoKing', 'SkinHunter', 'GamingPro', 'LuckyWinner', 'CrateMaster'];

      return Array.from({ length: 5 }, (_, i) => {
        const randomUser = usernames[Math.floor(Math.random() * usernames.length)];
        const randomItem = items[Math.floor(Math.random() * items.length)];
        const randomGame = gameTypes[Math.floor(Math.random() * gameTypes.length)];
        const amount = Math.floor(Math.random() * 500) + 10;
        const isWin = Math.random() > 0.5;
        
        return {
          id: `fallback_${i}_${Date.now()}`,
          type: (isWin ? 'win' : 'crate') as Activity['type'],
          message: isWin 
            ? `won ${amount} coins on ${randomGame}` 
            : `opened a crate and got ${randomItem}`,
          amount: amount,
          item: isWin ? undefined : randomItem,
          gameType: randomGame,
          multiplier: isWin ? +(1 + Math.random() * 3).toFixed(2) : undefined,
          timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          user: {
            username: randomUser,
            avatar: `https://picsum.photos/32/32?random=${i + 200}`,
            role: Math.random() > 0.8 ? 'vip' : 'player',
            xp: Math.floor(Math.random() * 5000) + 500,
            level: Math.floor(Math.random() * 50) + 1,
            isVip: Math.random() > 0.8
          }
        };
      });
    };

    // Retry mechanism for failed requests
    const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 2): Promise<Response> => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          // Create a new controller for each retry to avoid signal issues
          const retryController = new AbortController();
          const retryTimeoutId = setTimeout(() => retryController.abort(), 8000); // 8 second timeout per retry
          
          const retryOptions = {
            ...options,
            signal: retryController.signal
          };
          
          const response = await fetch(url, retryOptions);
          clearTimeout(retryTimeoutId);
          return response;
        } catch (error) {
          console.warn(`Fetch attempt ${i + 1} failed:`, error);
          if (i === maxRetries - 1) throw error;
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
      throw new Error('Max retries exceeded');
    };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let carouselTimeout: NodeJS.Timeout;
    let isVisible = true;
    let isMounted = true; // Track if component is still mounted

    const fetchActivities = async () => {
      // Only fetch if the page is visible and component is mounted
      if (!isVisible || !isMounted) return;
      
      // Restore real API calls with proper error handling
      try {
        console.log('Fetching real activities from Supabase...');
        
        const response = await fetch(`/api/activity?t=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          mode: 'cors',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (!isMounted) return;
        
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            console.log('Successfully loaded real activities:', data.length);
            setActivities(data);
            
            // Set up carousel rotation with real data
            if (data.length >= 5) {
              carouselTimeout = setInterval(() => {
                setActivities(prevActivities => {
                  const rotated = [...prevActivities.slice(1), prevActivities[0]];
                  return rotated;
                });
              }, 4000);
            }
            
            // Periodic refresh every 30 seconds
            interval = setInterval(() => {
              if (isVisible && isMounted) {
                fetchActivities();
              }
            }, 30000);
            
            return; // Exit early on success
          }
        }
        
        console.warn('API returned empty or invalid data, using fallback');
      } catch (error) {
        console.error('Real API fetch failed:', error);
      }
      
      // Fallback to generated data only if real API fails
      console.log('Using fallback activities');
      const fallbackActivities = generateFallbackActivities();
      setActivities(fallbackActivities);
      setLoading(false);
      
      // Set up carousel rotation with fallback data
      if (fallbackActivities.length >= 5) {
        carouselTimeout = setInterval(() => {
          setActivities(prevActivities => {
            const rotated = [...prevActivities.slice(1), prevActivities[0]];
            return rotated;
          });
        }, 4000);
      }
      
      // Try real API again in 30 seconds
      interval = setInterval(() => {
        if (isVisible && isMounted) {
          fetchActivities();
        }
      }, 30000);
    };

    // Handle page visibility changes to pause/resume polling
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      
      if (isVisible) {
        // Page became visible, resume polling
        fetchActivities();
      } else {
        // Page became hidden, clear intervals to save resources
        if (interval) clearInterval(interval);
        if (carouselTimeout) clearTimeout(carouselTimeout);
      }
    };

    // Add initial delay to prevent immediate fetch on mount
    const initialTimeout = setTimeout(() => {
      fetchActivities();
    }, 1000); // 1 second delay

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Listen for game completion events to refresh immediately
    const handleGameCompleted = () => {
      // Only refresh if page is visible
      if (isVisible) {
        // Add a small delay to ensure the activity is logged
        setTimeout(() => {
          fetchActivities();
        }, 1000);
      }
    };

    window.addEventListener('gameCompleted', handleGameCompleted);

    return () => {
      isMounted = false; // Mark component as unmounted
      if (initialTimeout) clearTimeout(initialTimeout);
      if (interval) clearInterval(interval);
      if (carouselTimeout) clearTimeout(carouselTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('gameCompleted', handleGameCompleted);
    };
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="bg-background/80 backdrop-blur-sm z-40 border-b border-border/40 text-sm overflow-hidden group w-full relative">
        <div className="flex items-center justify-center py-2.5">
          <span className="text-muted-foreground">Loading activities...</span>
        </div>
      </div>
    );
  }

  // Duplicate to create a seamless loop
  const duplicatedActivities = [...activities, ...activities];

  return (
    <div className="bg-background/80 backdrop-blur-sm z-40 border-b border-border/40 text-sm overflow-hidden group w-full relative">
      <div className="flex animate-marquee-faster group-hover:[animation-play-state:paused] whitespace-nowrap">
        {duplicatedActivities.map((activity: Activity, index) => (
          <div key={`${activity.id}-${index}`} className="flex items-center flex-shrink-0 mx-4 py-2.5">
            {(() => {
              const Icon = iconFromName(activity.type) as React.ComponentType<{ className?: string }>;
              const isRewardActivity = activity.type === 'crate' || activity.type === 'win' || activity.type === 'achievement';
              return (
                <Icon className={`h-4 w-4 mr-3 ${isRewardActivity ? 'text-yellow-400 animate-pulse' : 'text-primary'}`} />
              );
            })()}
            <UserProfileLink user={{
              name: activity.user.username,
              avatar: activity.user.avatar,
              role: activity.user.role,
              xp: activity.user.xp || 0,
              level: activity.user.level,
              isVip: activity.user.isVip,
              dataAiHint: "user avatar"
            }} />
            <span className="text-muted-foreground mx-1.5 text-xs">
              {activity.message.split(' ').map((word, wordIndex) => {
                // Highlight items and rewards with brighter colors
                const isItem = word.includes('|') || word.includes('★') || word.includes('Karambit') || word.includes('Bayonet') || word.includes('Dragon') || word.includes('Lore') || word.includes('Fade') || word.includes('Crimson') || word.includes('Web') || word.includes('AK-47') || word.includes('Redline') || word.includes('AWP');
                const isRarity = word.includes('(Covert)') || word.includes('(Classified)') || word.includes('(Legendary)') || word.includes('(Epic)');
                const isAmount = /^\d+/.test(word) && (word.includes('coins') || word.includes('XP'));
                const isMultiplier = word.includes('x') && /^\d+\.?\d*x$/.test(word);
                const isAchievement = word.includes('achievement:') || word.includes('High') || word.includes('Roller');
                const isWinAmount = word.includes('coins') && activity.type === 'win';
                
                if (isItem || isRarity) {
                  return (
                    <span key={wordIndex} className="text-yellow-300 font-bold animate-pulse">
                      {word}{' '}
                    </span>
                  );
                } else if (isAmount || isWinAmount) {
                  return (
                    <span key={wordIndex} className="text-green-400 font-semibold">
                      {word}{' '}
                    </span>
                  );
                } else if (isMultiplier) {
                  return (
                    <span key={wordIndex} className="text-blue-400 font-semibold">
                      {word}{' '}
                    </span>
                  );
                } else if (isAchievement) {
                  return (
                    <span key={wordIndex} className="text-purple-400 font-semibold">
                      {word}{' '}
                    </span>
                  );
                } else {
                  return <span key={wordIndex}>{word + ' '}</span>;
                }
              })}
            </span>
            <span className="text-primary/50 mx-4">•</span>
          </div>
        ))}
      </div>
    </div>
  );
}
