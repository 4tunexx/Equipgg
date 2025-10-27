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
      .select('email_verified, steam_verified, provider, account_status, email')
      .eq('id', userId)
      .single();
    let user = userRes.data as any;
    const error = userRes.error;
    
  // If no user row exists, try to create a minimal profile from Auth (if admin API available)
  if (error || !user) {
    try {
      console.log('No users row found for', userId, '- attempting auto-creation from Auth metadata');
      
      // Try to get auth user metadata via the Admin API (requires SERVICE_ROLE key)
      const { data: authUserData, error: adminErr } = await supabase.auth.admin.getUserById(userId as string as any).catch(() => ({ data: null, error: true }));

      if (adminErr) {
        console.error('Admin API error - cannot access auth.admin.getUserById:', adminErr);
        console.error('Check SUPABASE_SERVICE_ROLE_KEY is set in environment');
      }
      
      const emailFromAuth = authUserData?.user?.email || null;
      console.log('Auth metadata found:', { userId, email: emailFromAuth || 'none' });        // If we have at least an email from Auth, upsert a minimal users row so other systems work
        if (emailFromAuth) {
          const upsertPayload: any = {
            id: userId,
            email: emailFromAuth,
            role: 'user',
            coins: 0,
            xp: 0,
            level: 1,
            created_at: new Date().toISOString()
          };

        const { error: upsertError } = await supabase
          .from('users')
          .upsert(upsertPayload, { onConflict: 'id' })
          .catch((e) => ({ error: e }));
        
        if (upsertError) {
          console.error('Failed to upsert minimal user row:', upsertError);
          console.error('User payload was:', upsertPayload);
        } else {
          console.log('Successfully created minimal users row for', userId);
        }

        // Re-fetch the user row
        const { data: reUser, error: reError } = await supabase
          .from('users')
          .select('email_verified, steam_verified, provider, account_status, email')
          .eq('id', userId)
          .single();          if (!reError && reUser) {
            // continue processing with reUser
            // reuse variable name 'user'
            // @ts-ignore
            user = reUser;
            console.log('Re-fetched user row after upsert:', { userId, hasRow: !!reUser });
          } else if (reError) {
            console.error('Failed to re-fetch user after upsert:', reError);
          }
        }
      } catch (innerErr) {
        console.error('Error during user auto-creation:', innerErr);
        console.error('Stack:', innerErr instanceof Error ? innerErr.stack : 'No stack available');
      }

      if (!user) {
        console.error('FINAL: No users row exists and auto-creation failed for user:', userId);
        return {
          isVerified: false,
          requiresEmailVerification: true,
          requiresSteamVerification: true,
          canUseBalances: false,
          message: 'User not found'
        };
      }
    }
    
    // Check Supabase Auth for email confirmation status (use admin API when available)
    let emailConfirmedFromAuth = false;
    try {
      const adminResp = await supabase.auth.admin.getUserById(userId as string as any).catch(() => null);
      emailConfirmedFromAuth = !!adminResp?.data?.user?.email_confirmed_at;
    } catch (e) {
      // Admin API not available or failed - fall back to false
      emailConfirmedFromAuth = false;
    }
    
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

