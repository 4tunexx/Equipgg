
'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MiniProfileCard } from "@/components/mini-profile-card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { getRoleColors, getRoleInlineStyle } from "@/lib/role-colors";

// Local type definition for LeaderboardPlayer
type LeaderboardPlayer = {
    id?: string;
    name?: string;
    username?: string;
    avatar?: string | null;
    level?: number;
    xp?: number;
    isVip?: boolean;
    role?: string;
    achievement?: { 
        title: string; 
        icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; 
    };
    equippedItem?: { 
        name: string; 
        image: string; 
        rarity: any; 
        dataAiHint: string; 
    };
};

interface UserProfileLinkProps {
    user: LeaderboardPlayer & { 
        rank?: number;
        level?: number;
        isVip?: boolean;
        role?: string;
        xp?: number;
        achievement?: { title: string, icon: React.ComponentType<React.SVGProps<SVGSVGElement>> };
        equippedItem?: { name: string, image: string, rarity: any, dataAiHint: string };
    };
    avatarOnly?: boolean;
    hideAvatar?: boolean;
}

export function UserProfileLink({ user, avatarOnly = false, hideAvatar = false }: UserProfileLinkProps) {
    const avatarSizeClass = avatarOnly ? "w-10 h-10" : "w-6 h-6";
    
    // Handle both 'name' and 'username' properties safely
    const displayName = user.name || (user as any).username || 'Anonymous';
    const userAvatar = user.avatar && user.avatar !== 'null' ? user.avatar : 'https://picsum.photos/40/40?random=1';
    
    // Role-based name coloring
    const roleColors = getRoleColors(user.role || 'user');
    const roleInlineStyle = getRoleInlineStyle(user.role || 'user');

    const triggerContent = avatarOnly ? (
        <Avatar className={avatarSizeClass}>
            <AvatarImage src={userAvatar} alt={displayName} data-ai-hint={user.dataAiHint} />
            <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
    ) : (
         <div className="flex items-center gap-2">
            {!hideAvatar && (
                <Avatar className={avatarSizeClass}>
                    <AvatarImage src={userAvatar} alt={displayName} data-ai-hint={user.dataAiHint} />
                    <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
            )}
            <span className={`font-semibold hover:text-primary transition-colors ${roleColors.text}`} style={roleInlineStyle}>{displayName}</span>
        </div>
    );

    return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="cursor-pointer inline-block">{triggerContent}</div>
                </TooltipTrigger>
                <TooltipPrimitive.Portal>
                    <TooltipContent side="bottom" align="start" className="p-0 bg-transparent border-none shadow-none z-50">
                        <MiniProfileCard user={user} />
                    </TooltipContent>
                </TooltipPrimitive.Portal>
            </Tooltip>
        </TooltipProvider>
    )
}
