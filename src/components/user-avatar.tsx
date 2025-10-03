'use client';

import { useState } from 'react';
import { cn } from "../lib/utils";
import { getRoleColors } from "../lib/role-colors";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { 
  getUserAvatarUrl, 
  getUserDisplayName, 
  getUserInitials, 
  getUserAvatarColor,
  isUserSteamAuthenticated 
} from "../lib/avatar-utils";

interface User {
  username?: string;
  name?: string;
  displayName?: string;
  displayname?: string;
  avatar?: string;
  avatar_url?: string;
  role?: string;
  provider?: 'steam' | 'default';
  steam_verified?: boolean;
  steam_id?: string;
  steamProfile?: {
    avatar?: string;
  };
}

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showOnlineStatus?: boolean;
  showRoleBorder?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg'
};

export function UserAvatar({ 
  user, 
  size = 'md', 
  className, 
  showOnlineStatus = false,
  showRoleBorder = false
}: UserAvatarProps) {
  const avatarUrl = getUserAvatarUrl(user);
  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);
  const avatarColor = getUserAvatarColor(user);
  const isSteamUser = isUserSteamAuthenticated(user);
  
  const roleColors = getRoleColors(user.role || 'user');
  
  return (
    <div className={cn(
      'relative inline-flex',
      className
    )}>
      <Avatar className={cn(
        sizeClasses[size],
        showRoleBorder && user.role && user.role !== 'user' && `border-2 ${roleColors.border}`
      )}>
        {avatarUrl && (
          <AvatarImage 
            src={avatarUrl} 
            alt={`${displayName}'s avatar`}
            className="object-cover"
          />
        )}
        <AvatarFallback className={cn(
          'text-white font-medium',
          avatarColor
        )}>
          {initials}
        </AvatarFallback>
      </Avatar>
      
      {/* Steam badge for Steam users */}
      {isSteamUser && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#1b2838] rounded-full flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.52 0 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        </div>
      )}
      
      {/* Online status indicator */}
      {showOnlineStatus && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
      )}
    </div>
  );
}

// Skeleton loader for avatar
export function UserAvatarSkeleton({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  return (
    <div className={cn(
      'rounded-full bg-muted animate-pulse',
      sizeClasses[size],
      className
    )} />
  );
}