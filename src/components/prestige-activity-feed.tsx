
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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let carouselTimeout: NodeJS.Timeout;
    let currentIndex = 0;

    const fetchActivities = async () => {
      try {
        // Add cache-busting parameter to ensure fresh data
        const response = await fetch(`/api/activity?t=${Date.now()}`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setActivities(data);
            
            // If we have 5+ activities, start carousel rotation instead of frequent polling
            if (data.length >= 5) {
              console.log(`Found ${data.length} activities - switching to carousel mode`);
              // Clear any existing interval
              if (interval) clearInterval(interval);
              
              // Start carousel rotation every 3 seconds instead of API polling
              carouselTimeout = setInterval(() => {
                setActivities(prevActivities => {
                  // Rotate the activities array to create carousel effect
                  const rotated = [...prevActivities.slice(1), prevActivities[0]];
                  return rotated;
                });
              }, 3000);
              
              // Still poll for new activities, but much less frequently (every 30 seconds)
              interval = setInterval(fetchActivities, 30000);
            } else {
              console.log(`Found ${data.length} activities - using frequent polling mode`);
              // Clear carousel if we have fewer than 5 activities
              if (carouselTimeout) clearTimeout(carouselTimeout);
              // Use frequent polling when we have few activities
              interval = setInterval(fetchActivities, 5000);
            }
          } else {
            console.warn('Activity API returned non-array data:', data);
            setActivities([]);
          }
        } else {
          console.warn('Activity API returned error status:', response.status, response.statusText);
          setActivities([]);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchActivities();

    // Listen for game completion events to refresh immediately
    const handleGameCompleted = () => {
      // Add a small delay to ensure the activity is logged
      setTimeout(() => {
        fetchActivities();
      }, 1000);
    };

    window.addEventListener('gameCompleted', handleGameCompleted);

    return () => {
      if (interval) clearInterval(interval);
      if (carouselTimeout) clearTimeout(carouselTimeout);
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
                  return word + ' ';
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
