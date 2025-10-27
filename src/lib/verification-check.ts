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
      
      console.log('Checking service role key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
      
      // First try admin API
      const adminResult = await supabase.auth.admin.getUserById(userId as string as any)
        .catch(e => {
          console.error('Admin API error details:', e);
          return { data: null, error: e };
        });

      // If admin fails, try standard auth API with anon key
      const { data: authUserData, error: adminErr } = adminResult;
      
      if (adminErr || !authUserData?.user) {
        console.error('Admin API failed, error:', adminErr);
        console.error('Service role present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
        
        // Try to get user from auth metadata table directly
        const { data: directAuthData } = await supabase
          .from('auth.users')
          .select('email, id')
          .eq('id', userId)
          .single()
          .catch(e => {
            console.error('Direct auth query failed:', e);
            return { data: null };
          });
          
        if (directAuthData?.email) {
          console.log('Found user via direct auth query:', directAuthData);
          authUserData = { user: directAuthData };
        }
      }
      
      const emailFromAuth = authUserData?.user?.email || null;
      console.log('Auth metadata found:', { 
        userId, 
        email: emailFromAuth || 'none',
        hasAuthData: !!authUserData?.user,
        adminApiWorked: !adminErr
      });        // If we have at least an email from Auth, upsert a minimal users row so other systems work
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

        // Try to upsert with admin key first
        const { error: upsertError } = await supabase
          .from('users')
          .upsert(upsertPayload, { onConflict: 'id' })
          .catch((e) => ({ error: e }));
        
        if (upsertError) {
          console.error('Failed to upsert minimal user row:', upsertError);
          console.error('User payload was:', upsertPayload);
          console.error('Trying RLS policy...');
          
          // If admin upsert fails, try through RLS policy
          const { error: rlsError } = await supabase
            .from('users')
            .insert([upsertPayload])
            .select()
            .catch(e => ({ error: e }));
            
          if (rlsError) {
            console.error('RLS insert also failed:', rlsError);
          } else {
            console.log('Successfully created user row via RLS');
          }
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

