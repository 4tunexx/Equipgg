
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { DBUser, Rarity } from '@/lib/supabase/queries';
import { BadgeCheck, Trophy } from "lucide-react";
import Image from "next/image";
import ItemImage from "@/components/ItemImage";
// Define utility constants locally
const rarityGlow: Record<Rarity, string> = {
  'Common': 'shadow-gray-500/50',
  'Uncommon': 'shadow-green-500/50',
  'Rare': 'shadow-blue-500/50',
  'Epic': 'shadow-purple-500/50',
  'Legendary': 'shadow-yellow-500/50'
};

type LeaderboardPlayer = {
  id?: string;
  name: string;
  avatar?: string;
  role: string;
  dataAiHint: string;
  xp: number;
  level?: number;
  coins?: number;
};
import { getRoleColors, getRoleInlineStyle } from "@/lib/role-colors";
import { XpDisplay } from "@/components/xp-display";
import { useState, useEffect } from "react";

interface MiniProfileCardProps {
    user: LeaderboardPlayer & { 
        level?: number;
        rank?: number;
        isVip?: boolean;
        role?: string;
        xp?: number;
        achievement?: { title: string, icon: React.ComponentType<React.SVGProps<SVGSVGElement>> };
        equippedItem?: { name: string, image: string, rarity: Rarity, dataAiHint: string, type: string };
    };
}

export function MiniProfileCard({ user }: MiniProfileCardProps) {
    const [userStats, setUserStats] = useState<{
        xp: number;
        level: number;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const displayUser = user;

    // Fetch real-time user stats for the specific user
    useEffect(() => {
        const fetchUserStats = async () => {
            // If user already has xp and level data, don't fetch
            if (displayUser.xp !== undefined && displayUser.level !== undefined) {
                setIsLoading(false);
                return;
            }

            const username = displayUser.name || (displayUser as any).username;
            if (!username) {
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
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserStats();
    }, [displayUser.name, (displayUser as any).username, displayUser.xp, displayUser.level]);
    const level = userStats?.level || displayUser.level || 1;
    const xp = userStats?.xp || displayUser.xp || 0;

    
    // Safely handle name property
    const displayName = displayUser.name || (displayUser as any).username || 'Anonymous';
    const userAvatar = displayUser.avatar || 'https://picsum.photos/40/40?random=1';
    
    // Role-based name coloring
    const roleColors = getRoleColors(displayUser.role || 'user');
    const roleInlineStyle = getRoleInlineStyle(displayUser.role || 'user');

    return (
        <Card className="w-80 border-primary/20">
            <CardHeader className="p-4">
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
                        autoFetch={true}
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
                            <p className="font-semibold text-sm">{displayUser.rank}</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
