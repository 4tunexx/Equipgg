import { getRoleColors, getRoleIcon, getRoleDisplayName } from '@/lib/role-colors';
import { cn } from '@/lib/utils';

interface UserBadgeProps {
  role: string;
  displayName?: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showRole?: boolean;
  className?: string;
}

export function UserBadge({ 
  role, 
  displayName, 
  avatarUrl, 
  size = 'md', 
  showRole = true,
  className 
}: UserBadgeProps) {
  const colors = getRoleColors(role);
  const icon = getRoleIcon(role);
  const roleName = getRoleDisplayName(role);

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  return (
    <div className={cn(
      'inline-flex items-center gap-2 rounded-full border',
      colors.bg,
      colors.border,
      sizeClasses[size],
      className
    )}>
      {avatarUrl ? (
        <img 
          src={avatarUrl} 
          alt={displayName || roleName}
          className={cn(
            'rounded-full object-cover',
            size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'
          )}
        />
      ) : (
        <span className={cn(
          'flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700',
          size === 'sm' ? 'w-4 h-4 text-xs' : size === 'md' ? 'w-5 h-5 text-sm' : 'w-6 h-6 text-base'
        )}>
          {icon}
        </span>
      )}
      
      {displayName && (
        <span className={cn('font-medium', colors.text)}>
          {displayName}
        </span>
      )}
      
      {showRole && (
        <span className={cn(
          'rounded-full px-2 py-0.5 text-xs font-medium',
          colors.badge
        )}>
          {roleName}
        </span>
      )}
    </div>
  );
}

interface RoleBadgeProps {
  role: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RoleBadge({ role, size = 'sm', className }: RoleBadgeProps) {
  const colors = getRoleColors(role);
  const icon = getRoleIcon(role);
  const roleName = getRoleDisplayName(role);

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full font-medium',
      colors.badge,
      sizeClasses[size],
      className
    )}>
      <span>{icon}</span>
      <span>{roleName}</span>
    </span>
  );
}
