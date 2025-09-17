export interface RoleColors {
  text: string;
  bg: string;
  border: string;
  badge: string;
}

export const getRoleColors = (role: string): RoleColors => {
  switch (role?.toLowerCase()) {
    case 'admin':
      return {
        text: 'text-red-500 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      };
    case 'moderator':
      return {
        text: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-800',
        badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
      };
    case 'user':
    default:
      return {
        text: 'text-white dark:text-gray-100',
        bg: 'bg-gray-50 dark:bg-gray-900/20',
        border: 'border-gray-200 dark:border-gray-800',
        badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
      };
  }
};

export const getRoleInlineStyle = (role: string): React.CSSProperties => {
  switch (role?.toLowerCase()) {
    case 'admin':
      return { color: '#ef4444' }; // red-500
    case 'moderator':
      return { color: '#ea580c' }; // orange-600
    case 'user':
    default:
      return { color: '#ffffff' }; // white
  }
};

export const getRoleIcon = (role: string): string => {
  switch (role?.toLowerCase()) {
    case 'admin':
      return '👑';
    case 'moderator':
      return '🛡️';
    case 'user':
    default:
      return '👤';
  }
};

export const getRoleDisplayName = (role: string): string => {
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'Admin';
    case 'moderator':
      return 'Moderator';
    case 'user':
    default:
      return 'User';
  }
};