'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getRoleColors } from '@/lib/role-colors';

interface UserAvatarProps {
  user: {
    username?: string;
    name?: string;
    avatar?: string;
    role?: string;
    provider?: 'steam' | 'default';
    steamProfile?: {
      avatar?: string;
    };
  };
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
  const [imageError, setImageError] = useState(false);
  
  // Get avatar URL based on provider
  const getAvatarUrl = () => {
    if (user.provider === 'steam' && user.steamProfile?.avatar) {
      return user.steamProfile.avatar;
    }
    return user.avatar;
  };
  
  // Get initials from username or name
  const getInitials = () => {
    const displayName = user.name || user.username || 'U';
    return displayName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Generate background color based on username
  const getBackgroundColor = () => {
    const name = user.username || user.name || 'default';
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };
  
  const avatarUrl = getAvatarUrl();
  const shouldShowImage = avatarUrl && !imageError;
  const roleColors = getRoleColors(user.role || 'user');
  
  return (
    <div className={cn(
      'relative inline-flex items-center justify-center rounded-full overflow-hidden',
      sizeClasses[size],
      showRoleBorder && user.role && user.role !== 'user' && `border-2 ${roleColors.border}`,
      className
    )}>
      {shouldShowImage ? (
        <Image
          src={avatarUrl}
          alt={`${user.username || user.name || 'User'}'s avatar`}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
          unoptimized={user.provider === 'steam'} // Steam avatars are external
        />
      ) : (
        <div className={cn(
          'w-full h-full flex items-center justify-center text-white font-medium',
          getBackgroundColor()
        )}>
          {getInitials()}
        </div>
      )}
      
      {/* Steam badge for Steam users */}
      {user.provider === 'steam' && (
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