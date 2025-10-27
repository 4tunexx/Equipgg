
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import type { Rarity } from "../lib/supabase/queries";
import { Trophy, ExternalLink } from "lucide-react";
import ItemImage from "./ItemImage";
import { useRouter } from "next/navigation";


type LeaderboardPlayer = {
  id?: string;
  name: string;
  username?: string;
  avatar?: string;
  role: string;
  dataAiHint: string;
  xp?: number;
  level?: number;
  coins?: number;
};
import { getRoleColors, getRoleInlineStyle } from "../lib/role-colors";
import { XpDisplay } from "./xp-display";
import { getLevelFromXP } from "../lib/xp-config";
import { useState, useEffect } from 'react';
import { getBannerGradient } from "../lib/profile-banners";
  
import { BadgeCheck } from "lucide-react";
import { rarityGlow } from "../lib/constants";

interface MiniProfileCardProps {
    user: LeaderboardPlayer & { 
        level?: number;
        rank?: number | { id: string; name: string; image_url?: string; tier: string };
        isVip?: boolean;
        role?: string;
        xp?: number;
        achievement?: { title: string, icon: React.ComponentType<React.SVGProps<SVGSVGElement>> };
        equippedItem?: { name: string, image: string, rarity: Rarity, dataAiHint: string, type: string };
        equipped_banner?: string;
    };
}

export function MiniProfileCard({ user }: MiniProfileCardProps) {
    const router = useRouter();
    const [userStats, setUserStats] = useState<{
        xp: number;
        level: number;
    } | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [equippedBanner, setEquippedBanner] = useState<string | undefined>(user?.equipped_banner);

    const displayUser = { ...user, equipped_banner: equippedBanner || user?.equipped_banner };
    const username = displayUser.name || displayUser.username || 'Anonymous';
    // Determine the best identifier for the profile URL - prefer ID, fall back to username
    const profileIdentifier = displayUser.id || displayUser.username || displayUser.name || username;
    
    // Update banner when user prop changes
    useEffect(() => {
        // Always sync with user's equipped_banner, even if it's null/undefined
        if (user?.equipped_banner) {
            setEquippedBanner(user.equipped_banner);
        } else {
            // If no banner set, use default
            setEquippedBanner('banner_default');
        }
    }, [user?.equipped_banner, user?.id]);
    
    // Listen for banner updates
    useEffect(() => {
        const handleBannerUpdate = (event: CustomEvent) => {
            if (event.detail?.bannerId) {
                console.log('MiniProfileCard: Banner update received:', event.detail.bannerId);
                setEquippedBanner(event.detail.bannerId);
            }
        };
        
        const handleUserUpdate = () => {
            // Refresh user data if needed
            if (user?.equipped_banner) {
                setEquippedBanner(user.equipped_banner);
            }
        };
        
        window.addEventListener('bannerEquipped', handleBannerUpdate as EventListener);
        window.addEventListener('userUpdated', handleUserUpdate);
        
        return () => {
            window.removeEventListener('bannerEquipped', handleBannerUpdate as EventListener);
            window.removeEventListener('userUpdated', handleUserUpdate);
        };
    }, [user?.equipped_banner]);

    // Fetch real-time user stats for the specific user
    useEffect(() => {
        const fetchUserStats = async () => {
            // If user already has xp and level data, don't fetch to avoid race conditions
            if (displayUser.xp !== undefined && displayUser.level !== undefined && displayUser.xp > 0) {
                setUserStats({
                    xp: displayUser.xp,
                    level: displayUser.level
                });
                setIsLoading(false);
                return;
            }

            const username = displayUser.name || displayUser.username;
            if (!username || username === 'Test User' || username === 'Anonymous') {
                // Skip API call for test/anonymous users, use provided data
                if (displayUser.xp !== undefined && displayUser.level !== undefined) {
                    setUserStats({
                        xp: displayUser.xp,
                        level: displayUser.level
                    });
                }
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/user/${encodeURIComponent(username)}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.user) {
                        setUserStats({
                            xp: data.user.xp || 0,
                            level: data.user.level || 1
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to fetch user stats for mini profile:', error);
                // Use provided data as fallback
                if (displayUser.xp !== undefined && displayUser.level !== undefined) {
                    setUserStats({
                        xp: displayUser.xp,
                        level: displayUser.level
                    });
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserStats();
    }, [displayUser.name, displayUser.username, displayUser.xp, displayUser.level]);
    
    // Calculate level from XP to ensure consistency
    const xp = userStats?.xp || displayUser.xp || 0;
    const level = getLevelFromXP(xp);

    
    // Safely handle name property - prioritize Steam displayname
    const displayName = displayUser.name || displayUser.username || (displayUser as any).steamProfile?.steamId || 'Anonymous';
    const userAvatar = (displayUser as any).avatar_url || displayUser.avatar || (displayUser as any).steamProfile?.avatar;
    
    // Role-based name coloring
    const roleColors = getRoleColors(displayUser.role || 'user');
    const roleInlineStyle = getRoleInlineStyle(displayUser.role || 'user');

    return (
        <Card className="w-80 border-primary/20 overflow-hidden">
            {/* Profile Banner */}
            <div 
                className="h-16" 
                style={{ background: getBannerGradient(displayUser.equipped_banner) }}
            />
            <CardHeader className="p-4 pt-2">
                <div className="flex items-center gap-4">
                    <Avatar className={cn("w-16 h-16 border-2 border-primary", displayUser.isVip && "border-purple-400")}>
                        <AvatarImage src={userAvatar} data-ai-hint={displayUser.dataAiHint} />
                        <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className={cn("text-xl font-bold font-headline", displayUser.isVip && "text-purple-400 animate-pulse", roleColors.text)} style={roleInlineStyle}>{displayName}</h3>
                        <p className="text-sm text-muted-foreground">New user</p>
                    </div>
                </div>
                <div className="mt-4">
                    <XpDisplay 
                        xp={xp} 
                        level={level}
                        userId={displayUser.id || displayUser.name}
                        autoFetch={false}
                        className=""
                    />
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">

                
                {displayUser.isVip && (
                     <div className="flex items-center gap-3 p-2 bg-secondary/50 rounded-md">
                        <BadgeCheck className="w-5 h-5 text-purple-400" />
                        <div>
                            <p className="text-xs text-muted-foreground">VIP Member</p>
                            <p className="font-semibold text-sm">Exclusive Perks Active</p>
                        </div>
                    </div>
                )}
                {level >= 5 && displayUser.achievement && (
                     <div className="flex items-center gap-3 p-2 bg-secondary/50 rounded-md">
                        <displayUser.achievement.icon className="w-5 h-5 text-yellow-400" />
                        <div>
                            <p className="text-xs text-muted-foreground">Showcased Achievement</p>
                            <p className="font-semibold text-sm">{displayUser.achievement.title}</p>
                        </div>
                    </div>
                )}
                 {level >= 10 && displayUser.equippedItem && (
                    <div className="flex items-center gap-3 p-2 bg-secondary/50 rounded-md">
                       <div className={cn("w-10 h-10 bg-secondary rounded-md flex items-center justify-center relative overflow-hidden", rarityGlow[displayUser.equippedItem.rarity])}>
                           <ItemImage
                             itemName={displayUser.equippedItem.name}
                             itemType={displayUser.equippedItem.type as 'skins' | 'knives' | 'gloves' | 'agents'}
                             width={40}
                             height={40}
                             className="object-contain p-1"
                           />
                       </div>
                       <div>
                           <p className="text-xs text-muted-foreground">Equipped Item</p>
                           <p className="font-semibold text-sm">{displayUser.equippedItem.name}</p>
                       </div>
                   </div>
                )}
                 {level >= 10 && displayUser.rank && (
                     <div className="flex items-center gap-3 p-2 bg-secondary/50 rounded-md">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                        <div>
                            <p className="text-xs text-muted-foreground">Current Rank</p>
                            <p className="font-semibold text-sm">
                                {typeof displayUser.rank === 'object' ? displayUser.rank.name : displayUser.rank}
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
            {username !== 'Anonymous' && username !== 'Test User' && profileIdentifier && (
                <div className="p-4 pt-0">
                    <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                            console.log('🔗 Profile link clicked for:', profileIdentifier);
                            router.push(`/user/${encodeURIComponent(profileIdentifier)}`);
                        }}
                    >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Full Profile
                    </Button>
                </div>
            )}
        </Card>
    )
}
