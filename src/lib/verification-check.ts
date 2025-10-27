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
      
      // Initialize variables
      let userData: { user?: { id: string; email: string | null; created_at?: string } } | null = null;
      let adminError: any = null;

      // For Steam users, we'll create a minimal profile directly
      // Steam users are pre-verified since they authenticated through Steam
      if (userId.startsWith('steam-')) {
        console.log('Processing Steam user:', userId);
        userData = {
          user: {
            id: userId,
            email: null, // Steam users might not have email
            created_at: new Date().toISOString()
          }
        };
      } else {
        // For non-Steam users, try admin API first
        console.log('Attempting admin API getUserById for non-Steam user...');
        
        try {
          const adminResult = await supabase.auth.admin.getUserById(userId);
          userData = adminResult.data;
          adminError = adminResult.error;
          console.log('Admin API response:', JSON.stringify(adminResult, null, 2));
          
          if (adminResult.error) {
            console.error('Admin API error:', adminResult.error);
          }
        } catch (e) {
          console.error('Admin API call failed:', e);
          adminError = e;
        }

        // If admin fails, try auth.users table
        if (!userData?.user?.email) {
          console.log('Admin API failed, trying auth.users table...');
          
          try {
            const { data: directAuthData, error: directError } = await supabase
              .from('auth.users')  // Changed from 'auth' to 'auth.users'
              .select('email, id, created_at')
              .eq('id', userId)
              .single();
              
            if (directError) {
              console.error('Auth.users query failed:', directError);
            } else if (directAuthData?.email) {
              console.log('Found user in auth.users:', directAuthData);
              userData = { 
                user: {
                  id: directAuthData.id,
                  email: directAuthData.email,
                  created_at: directAuthData.created_at
                }
              };
            }
          } catch (directError) {
            console.error('Error querying auth.users:', directError);
          }
        }
      }
      
      const emailFromAuth = userData?.user?.email || null;
      console.log('Auth metadata found:', { 
        userId, 
        email: emailFromAuth || 'none',
        hasAuthData: !!userData?.user?.email,
        adminApiWorked: !adminError
      });        // If we have at least an email from Auth, upsert a minimal users row so other systems work
        // Add user to users table if we got an email
        if (emailFromAuth) {
          console.log('Creating users row with email:', emailFromAuth);
          const upsertPayload = {
            id: userId,
            email: emailFromAuth,
            role: 'user',
            coins: 0,
            xp: 0,
            level: 1,
            created_at: new Date().toISOString(),
            // For Steam users, mark as verified since they authenticated via Steam
            steam_verified: userId.startsWith('steam-'),
            email_verified: false
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

