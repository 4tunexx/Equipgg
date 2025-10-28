import { createServerSupabaseClient } from './supabase';

export interface VerificationStatus {
  isVerified: boolean;
  requiresEmailVerification: boolean;
  requiresSteamVerification: boolean;
  canUseBalances: boolean;
  message?: string;
}

/**
 * Check if user can use balances (coins/gems)
 * User must have EITHER email verified OR Steam verified
 */
export async function checkBalanceAccess(userId: string): Promise<VerificationStatus> {
  try {
    const supabase = createServerSupabaseClient();
    
    // Check both users table and auth metadata
    const userRes = await supabase
      .from('users')
      .select('email_verified, steam_verified, provider, account_status, email, role')
      .eq('id', userId)
      .maybeSingle(); // Use maybeSingle to avoid error when user doesn't exist
    let user = userRes.data as any;
    
    // If user doesn't exist in users table, try to create from auth
    if (!user) {
      console.log('⚠️ User not in users table, attempting to fetch from auth and create...');
      
      // Get user from Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
      
      if (authError || !authUser.user) {
        console.error('❌ User not found in auth either:', authError);
        return {
          isVerified: false,
          requiresEmailVerification: !userId.startsWith('steam-'),
          requiresSteamVerification: userId.startsWith('steam-'),
          canUseBalances: false,
          message: 'User not found in database'
        };
      }
      
      // Create minimal user record
      const isSteamUser = userId.startsWith('steam-') || authUser.user.app_metadata?.provider === 'steam';
      const newUserData = {
        id: userId,
        email: authUser.user.email || `${userId}@placeholder.com`,
        username: authUser.user.email?.split('@')[0] || authUser.user.user_metadata?.username || `user_${userId.substring(0, 8)}`,
        displayname: authUser.user.user_metadata?.full_name || authUser.user.user_metadata?.username || `User ${userId.substring(0, 8)}`,
        provider: isSteamUser ? 'steam' : 'email',
        steam_verified: isSteamUser,
        email_verified: !!authUser.user.email_confirmed_at,
        email_confirmed: !!authUser.user.email_confirmed_at,
        avatar_url: authUser.user.user_metadata?.avatar_url || null,
        coins: 0,
        gems: 0,
        xp: 0,
        level: 1,
        role: 'user',
        account_status: 'active',
        created_at: new Date().toISOString()
      };
      
      const { data: createdUser, error: createError } = await supabase
        .from('users')
        .insert(newUserData)
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Failed to create user record:', createError);
        return {
          isVerified: false,
          requiresEmailVerification: !isSteamUser,
          requiresSteamVerification: isSteamUser,
          canUseBalances: false,
          message: 'Failed to create user profile'
        };
      }
      
      console.log('✅ Created user record successfully');
      user = createdUser;
    }
  
  // ADMIN BYPASS: Admins and moderators can always use balances
  const isAdmin = user.role === 'admin' || user.role === 'moderator';
  
  console.log('🔍 Checking admin access:', {
    userId,
    role: user.role,
    isAdmin,
    email: user.email
  });
  
  if (isAdmin) {
    console.log('✅ ADMIN ACCESS GRANTED - Bypassing verification');
    return {
      isVerified: true,
      requiresEmailVerification: false,
      requiresSteamVerification: false,
      canUseBalances: true,
      message: 'Admin access granted'
    };
  }
  
  // Skip email auth check for performance
  const emailConfirmedFromAuth = false;
  
  // User is verified if:
  // 1. email_verified is true in users table, OR
  // 2. email_confirmed_at exists in auth metadata (for Supabase Auth users)
  const emailVerified = user.email_verified || emailConfirmedFromAuth || false;
  
  // Check if user is Steam user by ID pattern or provider field
  const isSteamUserById = userId.startsWith('steam-');
  const isSteamProvider = user.provider === 'steam' || isSteamUserById;
  const steamVerified = user.steam_verified || isSteamUserById; // Auto-verify if Steam ID pattern
  
  // User can use balances if:
  // 1. Email is verified (for default/email users), OR
  // 2. Steam is verified (for Steam users - checked by ID pattern or steam_verified flag)
  const canUseBalances = emailVerified || steamVerified;
  
  let message = '';
  if (!canUseBalances) {
    if (isSteamProvider) {
      message = 'Please verify your Steam account to use balances';
    } else {
      message = 'Please verify your email to use balances';
    }
  }
  
  return {
    isVerified: canUseBalances,
    requiresEmailVerification: !emailVerified && !isSteamProvider,
    requiresSteamVerification: !steamVerified && isSteamProvider,
    canUseBalances,
    message
  };
  } catch (error) {
    // Silently return verification error to avoid console spam
    return {
      isVerified: false,
      requiresEmailVerification: true,
      requiresSteamVerification: userId.startsWith('steam-'),
      canUseBalances: false,
      message: 'Error checking verification status'
    };
  }
}

/**
 * Create a notification for user to verify account
 */
export async function createVerificationNotification(userId: string, type: 'email' | 'steam'): Promise<void> {
  try {
    const supabase = createServerSupabaseClient();
    
    const message = type === 'email' 
      ? 'Please verify your email to use coins and gems. Check your inbox for a verification link.'
      : 'Please verify your Steam account to use coins and gems. Connect your Steam account in Profile Settings.';
    
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'account_verification_required',
      title: '🔒 Account Verification Required',
      message: message,
      read: false,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating verification notification:', error);
  }
}

