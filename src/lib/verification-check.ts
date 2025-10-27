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
    const { data: user, error } = await supabase
      .from('users')
      .select('email_verified, steam_verified, provider, account_status, email')
      .eq('id', userId)
      .single();
    
    if (error || !user) {
      return {
        isVerified: false,
        requiresEmailVerification: true,
        requiresSteamVerification: true,
        canUseBalances: false,
        message: 'User not found'
      };
    }
    
    // Check Supabase Auth for email confirmation status
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const emailConfirmedFromAuth = authUser?.user?.email_confirmed_at !== null;
    
    // User is verified if:
    // 1. email_verified is true in users table, OR
    // 2. email_confirmed_at exists in auth metadata (for Supabase Auth users)
    const emailVerified = user.email_verified || emailConfirmedFromAuth || false;
    const steamVerified = user.steam_verified || false;
    const isSteamProvider = user.provider === 'steam';
    
    // User can use balances if:
    // 1. Email is verified (for default/email users), OR
    // 2. Steam is verified (for Steam users)
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
    console.error('Error checking verification status:', error);
    return {
      isVerified: false,
      requiresEmailVerification: true,
      requiresSteamVerification: true,
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

