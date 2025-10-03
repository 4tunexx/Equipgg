/**
 * Central avatar URL resolution logic
 * Priority order:
 * 1. User's custom avatar_url (from database)
 * 2. Steam profile avatar (stored in avatar_url during Steam auth)
 * 3. Default fallback avatar with user-specific color
 */
export function getUserAvatarUrl(user: any): string | null {
  // Check for direct avatar_url field (includes Steam avatars)
  if (user?.avatar_url) {
    return user.avatar_url;
  }
  
  // Legacy fallback for old avatar field
  if (user?.avatar) {
    return user.avatar;
  }
  
  // Check steamProfile object (in case it's passed separately)
  if (user?.steamProfile?.avatar) {
    return user.steamProfile.avatar;
  }
  
  // Check for photoURL (legacy field)
  if (user?.photoURL) {
    return user.photoURL;
  }
  
  // No avatar found
  return null;
}

/**
 * Get user display name with priority order:
 * 1. displayname (Steam display name)
 * 2. displayName
 * 3. name
 * 4. username
 * 5. Steam ID
 * 6. Default fallback
 */
export function getUserDisplayName(user: any): string {
  return (
    user?.displayname ||
    user?.displayName ||
    user?.name ||
    user?.username ||
    user?.steamProfile?.steamId ||
    user?.steam_id ||
    'Anonymous User'
  );
}

/**
 * Get user initials for avatar fallback
 */
export function getUserInitials(user: any): string {
  const displayName = getUserDisplayName(user);
  return displayName
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Generate consistent background color for avatar fallbacks
 */
export function getUserAvatarColor(user: any): string {
  const name = getUserDisplayName(user);
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
}

/**
 * Check if user has Steam authentication
 */
export function isUserSteamAuthenticated(user: any): boolean {
  return Boolean(
    user?.steam_verified ||
    user?.steam_id ||
    user?.provider === 'steam' ||
    user?.steamProfile
  );
}

/**
 * Get fallback avatar URL for users without custom avatars
 * Returns null to use initials fallback instead of placeholder images
 */
export function getFallbackAvatarUrl(user: any): string | null {
  // Don't use placeholder images - let components show initials instead
  return null;
}