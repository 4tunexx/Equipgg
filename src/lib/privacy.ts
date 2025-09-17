// Privacy-focused data collection and management

// Define what data we actually need to collect
export const REQUIRED_USER_DATA = {
  // Essential for account functionality
  id: true,
  email: true,
  displayName: true,
  role: true,
  
  // Game-related data
  xp: true,
  level: true,
  coins: true,
  gems: true,
  
  // Timestamps
  createdAt: true,
  lastLoginAt: true,
} as const;

export const OPTIONAL_USER_DATA = {
  // Optional profile data
  avatar_url: false, // User can choose to provide
  steamId: false, // Only if user links Steam account
  
  // Internal data (not exposed to user)
  passwordHash: false, // Never exposed
} as const;

// Data that should never be collected or stored
export const FORBIDDEN_DATA = [
  'real_name',
  'phone_number',
  'address',
  'credit_card',
  'ssn',
  'passport',
  'biometric_data',
  'location_history',
  'browsing_history',
  'device_fingerprint',
  'ip_address', // Only for security, not stored long-term
] as const;

// Data retention policies (in days)
export const DATA_RETENTION = {
  // Keep essential data indefinitely (user account)
  user_account: -1, // Indefinite
  
  // Keep game data for reasonable time
  game_history: 365, // 1 year
  chat_messages: 90, // 3 months
  transaction_history: 2555, // 7 years (financial records)
  
  // Keep security data for shorter periods
  login_attempts: 30, // 1 month
  security_logs: 90, // 3 months
  session_data: 1, // 1 day (after logout)
  
  // Keep analytics data for limited time
  usage_analytics: 90, // 3 months
  performance_metrics: 30, // 1 month
} as const;

// Functions to sanitize user data for different contexts
export function sanitizeUserForPublic(user: any): any {
  return {
    id: user.id,
    displayName: user.displayName,
    level: user.level,
    role: user.role,
    avatar_url: user.avatar_url,
    // Never expose: email, coins, gems, xp, internal data
  };
}

export function sanitizeUserForProfile(user: any): any {
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email, // Only for user's own profile
    level: user.level,
    xp: user.xp,
    coins: user.coins,
    gems: user.gems,
    avatar_url: user.avatar_url,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    // Never expose: passwordHash, internal notes, admin data
  };
}

export function sanitizeUserForAdmin(user: any): any {
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    level: user.level,
    xp: user.xp,
    coins: user.coins,
    gems: user.gems,
    avatar_url: user.avatar_url,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    // Admin can see more but still not passwordHash
  };
}

// Data minimization functions
export function minimizeGameData(gameData: any): any {
  return {
    id: gameData.id,
    gameType: gameData.gameType,
    betAmount: gameData.betAmount,
    winnings: gameData.winnings,
    profit: gameData.profit,
    createdAt: gameData.createdAt,
    // Remove: detailed game state, user-specific data, internal IDs
  };
}

export function minimizeChatData(chatData: any): any {
  return {
    id: chatData.id,
    content: chatData.content,
    username: chatData.username,
    createdAt: chatData.createdAt,
    // Remove: user_id, internal data, metadata
  };
}

export function minimizeTransactionData(transactionData: any): any {
  return {
    id: transactionData.id,
    type: transactionData.type,
    amount: transactionData.amount,
    currency: transactionData.currency,
    description: transactionData.description,
    createdAt: transactionData.createdAt,
    // Remove: internal IDs, sensitive metadata
  };
}

// Data deletion functions
export async function deleteUserData(userId: string): Promise<void> {
  // This would be implemented with proper database access
  // For now, we'll define what should be deleted
  
  const tablesToClean = [
    'sessions',
    'user_mission_progress',
    'user_inventory',
    'user_transactions',
    'user_bets',
    'user_crates',
    'user_keys',
    'user_perks',
    'chat_messages',
    'game_history',
    'user_achievements',
    'gem_transactions',
    'payment_intents',
  ];
  
  console.log(`Would delete user data from tables: ${tablesToClean.join(', ')}`);
  // In production, this would actually delete the data
}

export async function anonymizeUserData(userId: string): Promise<void> {
  // Anonymize instead of delete (for legal/audit requirements)
  const anonymizedData = {
    displayName: `User_${userId.substring(0, 8)}`,
    email: `deleted_${userId.substring(0, 8)}@deleted.local`,
    avatar_url: null,
  };
  
  console.log(`Would anonymize user data:`, anonymizedData);
  // In production, this would actually anonymize the data
}

// Data export functions (for GDPR compliance)
export async function exportUserData(userId: string): Promise<any> {
  // Export all user data in a structured format
  return {
    user: {
      id: userId,
      // Include all user data
    },
    games: {
      // Include game history
    },
    transactions: {
      // Include transaction history
    },
    chat: {
      // Include chat messages
    },
    // ... other data categories
  };
}

// Consent management
export interface UserConsent {
  userId: string;
  dataProcessing: boolean;
  analytics: boolean;
  marketing: boolean;
  thirdPartySharing: boolean;
  updatedAt: string;
}

export function getDefaultConsent(): UserConsent {
  return {
    userId: '',
    dataProcessing: true, // Required for service functionality
    analytics: false, // Opt-in
    marketing: false, // Opt-in
    thirdPartySharing: false, // Opt-in
    updatedAt: new Date().toISOString(),
  };
}

// Data collection validation
export function validateDataCollection(data: any, context: string): boolean {
  // Check if we're collecting only necessary data
  const allowedFields = getAllowedFields(context);
  
  for (const field of Object.keys(data)) {
    if (!allowedFields.includes(field)) {
      console.warn(`Collecting unnecessary data: ${field} in context: ${context}`);
      return false;
    }
  }
  
  return true;
}

function getAllowedFields(context: string): string[] {
  switch (context) {
    case 'user_registration':
      return ['email', 'displayName', 'password'];
    case 'game_play':
      return ['gameType', 'betAmount', 'gameId'];
    case 'chat_message':
      return ['content', 'channel'];
    case 'betting':
      return ['matchId', 'teamId', 'amount', 'odds'];
    default:
      return [];
  }
}

// Privacy-focused logging
export function logPrivacyEvent(event: string, data: any): void {
  // Only log what's necessary for security/functionality
  const sanitizedData = {
    event,
    timestamp: new Date().toISOString(),
    // Only include non-sensitive data
    userId: data.userId ? data.userId.substring(0, 8) + '***' : undefined,
    action: data.action,
    // Never log: passwords, personal info, sensitive data
  };
  
  console.log('PRIVACY_EVENT:', sanitizedData);
}

// Cookie consent management
export interface CookieConsent {
  necessary: boolean; // Always true (required for functionality)
  analytics: boolean; // Optional
  marketing: boolean; // Optional
  preferences: boolean; // Optional
}

export function getDefaultCookieConsent(): CookieConsent {
  return {
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  };
}

// Data breach notification (for compliance)
export function notifyDataBreach(affectedUsers: string[], breachType: string): void {
  // In production, this would send notifications to affected users
  console.log(`DATA_BREACH_NOTIFICATION: ${breachType} affecting ${affectedUsers.length} users`);
}
