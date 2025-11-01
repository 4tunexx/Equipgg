
'use client';

import { UserProfileLink } from "./user-profile-link";
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Gem, Trophy as TrophyIcon, Award as AwardIcon, Crown as CrownIcon, Zap as ZapIcon } from 'lucide-react';
import { getRarityColor, parseItemFromText } from '@/lib/rarity-utils';

interface Activity {
  id: string;
  type: 'bet' | 'win' | 'crate' | 'trade' | 'achievement';
  message: string;
  amount?: number;
  item?: string;
  rarity?: string;
  gameType?: string;
  multiplier?: number;
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



export function PrestigeActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const activitiesRef = useRef<Activity[]>([]);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const carouselTimeoutRef = useRef<NodeJS.Timeout | null>(null);



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
        const amount = Math.floor(Math.random() * 500) + 50;
        const isWin = Math.random() > 0.4; // 60% wins, 40% crate openings
        
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



  useEffect(() => {
    const fetchActivities = async () => {
      try {
        console.log('🌎 PRESTIGE FEED: Fetching activities from API...');
        const response = await fetch('/api/activity');
        
        if (response.ok) {
          const data = await response.json();
          console.log('📡 PRESTIGE FEED: API Response:', data);
          
          if (data.activities && data.activities.length > 0) {
            console.log('✅ PRESTIGE FEED: Loaded', data.activities.length, 'REAL activities');
            console.log('👀 First 3 activities:', data.activities.slice(0, 3));
            
            // Clear any existing intervals
            if (carouselTimeoutRef.current) {
              clearInterval(carouselTimeoutRef.current);
            }
            
            // Update ref and state
            activitiesRef.current = data.activities;
            setActivities(data.activities);
            setLoading(false);
            
            // Set up carousel rotation with real data - REMOVED to prevent flickering
            // The marquee animation handles the scrolling, no need for manual rotation
          } else {
            // No real activities, use fallback
            console.warn('⚠️ PRESTIGE FEED: No activities in response, using fallback');
            const fallbackActivities = generateFallbackActivities();
            setActivities(fallbackActivities);
            setLoading(false);
          }
        } else {
          // API error, use fallback
          console.error('❌ PRESTIGE FEED: API returned status', response.status);
          const fallbackActivities = generateFallbackActivities();
          setActivities(fallbackActivities);
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ PRESTIGE FEED: Error fetching activities:', error);
        // Fetch failed, use fallback
        const fallbackActivities = generateFallbackActivities();
        setActivities(fallbackActivities);
        setLoading(false);
      }
    };

    fetchActivities();

    // Refresh activities every 30 seconds to get new data
    // Use a longer interval to reduce flickering
    refreshTimeoutRef.current = setInterval(() => {
      fetch('/api/activity')
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          return res.json();
        })
        .then(data => {
          // Check both possible response formats: { activities: [...] } or just [...]
          const activitiesArray = data.activities || data || [];
          if (activitiesArray.length > 0) {
            // Only update if activities actually changed
            const currentIds = activitiesRef.current.map(a => a.id).join(',');
            const newIds = activitiesArray.map((a: Activity) => a.id).join(',');
            
            if (currentIds !== newIds) {
              console.log('🔄 PRESTIGE FEED: Refreshed with', activitiesArray.length, 'activities');
              activitiesRef.current = activitiesArray;
              setActivities(activitiesArray);
            }
          }
        })
        .catch(err => {
          console.error('❌ PRESTIGE FEED: Error refreshing:', err);
        });
    }, 60000); // 60 seconds - longer to reduce flickering

    return () => {
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current);
      }
      if (carouselTimeoutRef.current) {
        clearInterval(carouselTimeoutRef.current);
      }
    };
  }, []);

  // Memoize duplicated activities to prevent unnecessary re-renders
  // MUST be called before any conditional returns to follow Rules of Hooks
  const duplicatedActivities = useMemo(() => {
    if (activities.length === 0) return [];
    // Duplicate 3 times for smoother infinite scroll
    return [...activities, ...activities, ...activities];
  }, [activities]);

  // Memoize message rendering logic
  // MUST be called before any conditional returns to follow Rules of Hooks
  const renderActivityMessage = useCallback((activity: Activity) => {
    // Use item and rarity from activity object if available, otherwise parse from message
    const itemName = activity.item || parseItemFromText(activity.message).itemName;
    const rarity = activity.rarity || parseItemFromText(activity.message).rarity;
    const rarityColor = rarity ? getRarityColor(rarity) : null;
    
    // Better approach: replace item name in message with colored version
    const message = activity.message;
    
    // Create a renderer that colors different parts
    const parts: Array<{ text: string; className: string; key: string }> = [];
    
    // Find item name in message and color it
    if (itemName && rarityColor) {
      const itemRegex = new RegExp(`(${itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const segments = message.split(itemRegex);
      
      segments.forEach((segment, i) => {
        const key = `seg-${i}`;
        if (segment.toLowerCase() === itemName.toLowerCase()) {
          parts.push({ text: segment, className: `${rarityColor} font-bold`, key });
        } else {
          // Check for other colored elements in this segment
          const segmentWords = segment.split(/(\s+)/);
          segmentWords.forEach((word, wordIndex) => {
            const wordKey = `${key}-word-${wordIndex}`;
            if (!word.trim()) {
              parts.push({ text: word, className: '', key: wordKey });
              return;
            }
            
            // Check for rarity in parentheses
            const isRarityWord = word.match(/\(([^)]+)\)/) && word.toLowerCase().includes(rarity?.toLowerCase() || '');
            if (isRarityWord && rarityColor) {
              parts.push({ text: word, className: `${rarityColor} font-semibold`, key: wordKey });
            }
            // Check for coins (green) - match "100 coins" or "100 coin"
            else if (/\d+\s*(coins|coin)/i.test(word)) {
              parts.push({ text: word, className: 'text-green-400 font-semibold', key: wordKey });
            }
            // Check for standalone numbers that might be followed by "coins"
            else if (/^\d+$/.test(word.trim())) {
              // Check if next word is "coins" or "coin"
              const nextWord = segmentWords[wordIndex + 1] || '';
              if (/coins?/i.test(nextWord)) {
                parts.push({ text: word, className: 'text-green-400 font-semibold', key: wordKey });
              } else if (/gems?/i.test(nextWord)) {
                parts.push({ text: word, className: 'text-blue-400 font-semibold', key: wordKey });
              } else if (/xp/i.test(nextWord)) {
                parts.push({ text: word, className: 'text-orange-400 font-semibold', key: wordKey });
              } else {
                parts.push({ text: word, className: '', key: wordKey });
              }
            }
            // Check for gems (blue/purple)
            else if (/\d+\s*(gems|gem)/i.test(word)) {
              parts.push({ text: word, className: 'text-blue-400 font-semibold', key: wordKey });
            }
            // Check for XP (orange)
            else if (/\d+\s*(XP|xp)/i.test(word)) {
              parts.push({ text: word, className: 'text-orange-400 font-semibold', key: wordKey });
            }
            // Check for "coins", "coin", "gems", "gem" words (to color them)
            else if (/^(coins?|gems?)$/i.test(word.trim())) {
              // Check if previous word was a number
              const prevWord = segmentWords[wordIndex - 2] || '';
              if (/^\d+$/.test(prevWord)) {
                parts.push({ 
                  text: word, 
                  className: /coins?/i.test(word) ? 'text-green-400 font-semibold' : 'text-blue-400 font-semibold',
                  key: wordKey
                });
              } else {
                parts.push({ text: word, className: '', key: wordKey });
              }
            }
            // Check for multiplier
            else if (/^\d+\.?\d*x$/i.test(word)) {
              parts.push({ text: word, className: 'text-blue-400 font-semibold', key: wordKey });
            }
            // Check for achievement
            else if (/achievement/i.test(word)) {
              parts.push({ text: word, className: 'text-purple-400 font-semibold', key: wordKey });
            }
            // Regular text
            else {
              parts.push({ text: word, className: '', key: wordKey });
            }
          });
        }
      });
    } else {
      // Fallback: word-by-word parsing if item name not found
      const words = message.split(/(\s+)/);
      words.forEach((word, wordIndex) => {
        const key = `word-${wordIndex}`;
        if (!word.trim()) {
          parts.push({ text: word, className: '', key });
          return;
        }
        
        // Check for standalone numbers
        if (/^\d+$/.test(word.trim())) {
          // Check if next word is "coins", "gems", or "XP"
          const nextWord = words[wordIndex + 1] || '';
          if (/coins?/i.test(nextWord)) {
            parts.push({ text: word, className: 'text-green-400 font-semibold', key });
          } else if (/gems?/i.test(nextWord)) {
            parts.push({ text: word, className: 'text-blue-400 font-semibold', key });
          } else if (/xp/i.test(nextWord)) {
            parts.push({ text: word, className: 'text-orange-400 font-semibold', key });
          } else {
            parts.push({ text: word, className: '', key });
          }
        }
        // Check for coins (green) - match "100 coins" or "100 coin"
        else if (/\d+\s*(coins|coin)/i.test(word)) {
          parts.push({ text: word, className: 'text-green-400 font-semibold', key });
        }
        // Check for gems (purple/blue)
        else if (/\d+\s*(gems|gem)/i.test(word)) {
          parts.push({ text: word, className: 'text-blue-400 font-semibold', key });
        }
        // Check for XP (orange)
        else if (/\d+\s*(XP|xp)/i.test(word)) {
          parts.push({ text: word, className: 'text-orange-400 font-semibold', key });
        }
        // Check for "coins", "coin", "gems", "gem" words
        else if (/^(coins?|gems?)$/i.test(word.trim())) {
          // Check if previous word was a number
          const prevWord = words[wordIndex - 2] || '';
          if (/^\d+$/.test(prevWord)) {
            parts.push({ 
              text: word, 
              className: /coins?/i.test(word) ? 'text-green-400 font-semibold' : 'text-blue-400 font-semibold',
              key
            });
          } else {
            parts.push({ text: word, className: '', key });
          }
        }
        // Check for multiplier
        else if (/^\d+\.?\d*x$/i.test(word)) {
          parts.push({ text: word, className: 'text-blue-400 font-semibold', key });
        }
        // Check for achievement
        else if (/achievement/i.test(word)) {
          parts.push({ text: word, className: 'text-purple-400 font-semibold', key });
        }
        // Regular text
        else {
          parts.push({ text: word, className: '', key });
        }
      });
    }
    
    return parts;
  }, []);

  // Show loading state (AFTER all hooks)
  if (loading) {
    return (
      <div className="bg-background/80 backdrop-blur-sm z-40 border-b border-border/40 text-sm overflow-hidden group w-full relative">
        <div className="flex items-center justify-center py-2.5">
          <span className="text-muted-foreground">Loading activities...</span>
        </div>
      </div>
    );
  }

  // Show message when no activities available (AFTER all hooks)
  if (!activities || activities.length === 0) {
    return (
      <div className="bg-background/80 backdrop-blur-sm z-40 border-b border-border/40 text-sm overflow-hidden group w-full relative">
        <div className="flex items-center justify-center py-2.5">
          <span className="text-muted-foreground">No activities available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background/80 backdrop-blur-sm z-40 border-b border-border/40 text-sm overflow-hidden group w-full relative">
      <div className="flex animate-marquee-faster group-hover:[animation-play-state:paused] whitespace-nowrap will-change-transform">
        {duplicatedActivities.map((activity: Activity, index) => {
          // Use stable key based on activity id and position in duplication
          const stableKey = `${activity.id}-dup-${Math.floor(index / activities.length)}`;
          const messageParts = renderActivityMessage(activity);
          
          return (
          <div key={stableKey} className="flex items-center flex-shrink-0 mx-4 py-2.5">
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
              {messageParts.map((part) => (
                <span key={part.key} className={part.className || ''}>
                  {part.text}
                </span>
              ))}
            </span>
            <span className="text-primary/50 mx-4">•</span>
          </div>
        );
        })}
      </div>
    </div>
  );
}
