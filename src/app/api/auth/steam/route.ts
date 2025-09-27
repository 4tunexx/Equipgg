import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login';
const STEAM_API_KEY = process.env.STEAM_API_KEY;
// Use localhost for development, production URL for production
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? (process.env.NEXTAUTH_URL || 'https://www.equipgg.net')
  : 'http://localhost:3001';

// Create Supabase clients
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Use service role for user creation, anon for regular operations
const supabaseAdmin = SUPABASE_SERVICE 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE)
  : createClient(SUPABASE_URL, SUPABASE_ANON);
  
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// Steam OpenID parameters
export function buildSteamAuthUrl(returnUrl: string) {
  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnUrl,
    'openid.realm': BASE_URL,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
  });
  
  return `${STEAM_OPENID_URL}?${params.toString()}`;
}

// Verify Steam OpenID response
export async function verifySteamResponse(params: URLSearchParams): Promise<string | null> {
  try {
    // Change mode to check_authentication
    const verifyParams = new URLSearchParams(params);
    verifyParams.set('openid.mode', 'check_authentication');
    
    const response = await fetch(STEAM_OPENID_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: verifyParams.toString()
    });
    
    const result = await response.text();
    
    if (result.includes('is_valid:true')) {
      // Extract Steam ID from claimed_id
      const claimedId = params.get('openid.claimed_id');
      if (claimedId) {
        const steamId = claimedId.replace('https://steamcommunity.com/openid/id/', '');
        return steamId;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Steam verification error:', error);
    return null;
  }
}

// Get Steam user info
export async function getSteamUserInfo(steamId: string) {
  if (!STEAM_API_KEY) {
    console.warn('Steam API key not configured, using fallback profile data');
    return {
      steamId: steamId,
      username: `Player_${steamId.slice(-4)}`,
      avatar: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb.jpg',
      profileUrl: `https://steamcommunity.com/profiles/${steamId}`
    };
  }
  try {
    const response = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId}`
    );
    const data = await response.json();
    if (data.response?.players?.length > 0) {
      const player = data.response.players[0];
      return {
        steamId: player.steamid,
        username: player.personaname,
        avatar: player.avatarfull || player.avatarmedium || player.avatar,
        profileUrl: player.profileurl
      };
    }
    return null;
  } catch (error) {
    console.error('Steam API error:', error);
    return null;
  }
}

// Handle GET request - initiate Steam auth
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  console.log('=== STEAM AUTH ENDPOINT HIT ===');
  console.log('URL:', request.url);
  console.log('Has openid.mode:', searchParams.has('openid.mode'));
  console.log('openid.mode value:', searchParams.get('openid.mode'));
  
  // If this is a callback from Steam
  if (searchParams.has('openid.mode')) {
    console.log('=== STEAM CALLBACK RECEIVED ===');
    try {
      const steamId = await verifySteamResponse(searchParams);
      if (!steamId) {
        console.error('Steam verification failed');
        return NextResponse.redirect(`${BASE_URL}/sign-in?error=steam_verification_failed`);
      }
      
      console.log('Steam verification successful, Steam ID:', steamId);
      
      // Get Steam user info
      const steamUser = await getSteamUserInfo(steamId);
      if (!steamUser) {
        console.error('Failed to get Steam user info');
        return NextResponse.redirect(`${BASE_URL}/sign-in?error=steam_api_failed`);
      }
      
      console.log('Steam user info retrieved:', steamUser);
      // Use simple database-only approach (no admin APIs)
      const email = `${steamUser.steamId}@steam.local`;
      let userId = null;
      let isVerification = false; // Track if this is linking an existing account
      
      console.log('Looking up Steam user by Steam ID:', steamUser.steamId);
      
      // First, check if this Steam ID is already linked to any account
      const { data: existingSteamUsers, error: steamLookupError } = await supabase
        .from('users')
        .select('id, email, steam_id')
        .eq('steam_id', steamUser.steamId)
        .limit(1);
        
      if (steamLookupError) {
        console.error('Failed to lookup Steam user:', steamLookupError);
        return NextResponse.redirect(`${BASE_URL}/sign-in?error=steam_lookup_failed`);
      }
      
      if (existingSteamUsers && existingSteamUsers.length > 0) {
        // Steam ID already linked to an account
        userId = existingSteamUsers[0].id;
        console.log('Found existing Steam-linked user:', userId);
        
        // Update user profile
        await supabase.from('users').update({
          username: steamUser.username,
          avatar_url: steamUser.avatar,
          last_login_at: new Date().toISOString() // Use correct column name
        }).eq('id', userId);
      } else {
        // Check if user exists by email (legacy users or partial records)
        const { data: existingEmailUsers, error: emailLookupError } = await supabase
          .from('users')
          .select('id, email, steam_id, username, displayname')
          .eq('email', email)
          .limit(1);
          
        if (emailLookupError) {
          console.error('Failed to lookup user by email:', emailLookupError);
          return NextResponse.redirect(`${BASE_URL}/sign-in?error=email_lookup_failed`);
        }
        
        if (existingEmailUsers && existingEmailUsers.length > 0) {
          // Found existing user by email - update with Steam info
          userId = existingEmailUsers[0].id;
          console.log('Found existing user by email, linking Steam:', userId);
          
          const { error: linkError } = await supabase
            .from('users')
            .update({
              steam_id: steamUser.steamId,
              steam_verified: true,
              username: steamUser.username, // Update username from displayname
              avatar_url: steamUser.avatar,
              account_status: 'active', // Use correct column name
              last_login_at: new Date().toISOString() // Use correct column name
            })
            .eq('id', userId);
            
          if (linkError) {
            console.error('Failed to link Steam to existing user:', linkError);
            return NextResponse.redirect(`${BASE_URL}/sign-in?error=steam_link_failed`);
          }
          
          console.log('Successfully linked Steam to existing user:', userId);
        } else {
          // Check if there's a pending Steam verification request
          const urlParams = new URL(request.url).searchParams;
          const verifyUserId = urlParams.get('verify_user');
          
          if (verifyUserId) {
            // This is a Steam verification for an existing email account
            console.log('Verifying Steam for existing user:', verifyUserId);
            
            // First check if this Steam ID is already linked to a different account
            const { data: conflictingUsers, error: conflictError } = await supabase
              .from('users')
              .select('id, email')
              .eq('steam_id', steamUser.steamId)
              .neq('id', verifyUserId)
              .limit(1);
              
            if (conflictError) {
              console.error('Error checking for Steam ID conflicts:', conflictError);
              return NextResponse.redirect(`${BASE_URL}/dashboard?error=verification_check_failed`);
            }
            
            if (conflictingUsers && conflictingUsers.length > 0) {
              console.error('Steam ID already linked to another account:', conflictingUsers[0]);
              return NextResponse.redirect(`${BASE_URL}/dashboard?error=steam_already_linked`);
            }
            
            const { error: verifyError } = await supabase
              .from('users')
              .update({
                steam_id: steamUser.steamId,
                steam_verified: true,
                account_status: 'active', // Use correct column name
                username: steamUser.username, // Update username to Steam username
                avatar_url: steamUser.avatar
              })
              .eq('id', verifyUserId);
              
            if (verifyError) {
              console.error('Failed to verify Steam for user:', verifyError);
              return NextResponse.redirect(`${BASE_URL}/dashboard?error=steam_verification_failed`);
            }
            
            userId = verifyUserId;
            isVerification = true;
            console.log('Successfully verified Steam for user:', userId);
          } else {
            // This is a new Steam-only registration
            console.log('Creating new Steam-only user');
            
            // Generate a consistent UUID for Steam users
            const steamUuid = `steam-${steamUser.steamId}`;
            
            // Check if a user with this ID already exists (from previous failed attempts)
            const { data: existingUser, error: checkError } = await supabase
              .from('users')
              .select('id, steam_id')
              .eq('id', steamUuid)
              .single();
              
            if (checkError && checkError.code !== 'PGRST116') {
              console.error('Error checking for existing user:', checkError);
              return NextResponse.redirect(`${BASE_URL}/sign-in?error=user_check_failed`);
            }
            
            if (existingUser) {
              // User already exists, just update their info and use them
              console.log('Found existing user with Steam UUID, updating info:', steamUuid);
              
              const { error: updateError } = await supabase
                .from('users')
                .update({
                  email: email,
                  username: steamUser.username,
                  avatar_url: steamUser.avatar,
                  steam_id: steamUser.steamId,
                  steam_verified: true,
                  account_status: 'active' // Use correct column name
                })
                .eq('id', steamUuid);
                
              if (updateError) {
                console.error('Failed to update existing Steam user:', updateError);
                return NextResponse.redirect(`${BASE_URL}/sign-in?error=user_update_failed`);
              }
              
              userId = steamUuid;
              console.log('Successfully updated existing Steam user:', userId);
            } else {
              // Create user directly in users table
              const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                  id: steamUuid,
                  email: email,
                  username: steamUser.username,
                  avatar_url: steamUser.avatar,
                  role: 'user',
                  coins: 1000, // Use correct column name
                  xp: 0,
                  level: 1,
                  steam_id: steamUser.steamId,
                  steam_verified: true,
                  account_status: 'active', // Use correct column name
                  created_at: new Date().toISOString(),
                  last_login_at: new Date().toISOString() // Use correct column name
                })
                .select('id')
                .single();
                
              if (createError) {
                console.error('Failed to create Steam user:', createError);
                return NextResponse.redirect(`${BASE_URL}/sign-in?error=user_create_failed&code=${createError.code}&msg=${encodeURIComponent(createError.message)}`);
              }
              
              if (!newUser) {
                console.error('User creation returned no data');
                return NextResponse.redirect(`${BASE_URL}/sign-in?error=user_create_no_data`);
              }
              
              userId = newUser.id;
              console.log('Successfully created Steam user:', userId);
            }
          }
        }
      }

      // Redirect to dashboard with appropriate message
      console.log('Steam auth successful, redirecting to dashboard');
      
      // Check for redirect parameter in the original request
      const urlParams = new URL(request.url).searchParams;
      const redirectTo = urlParams.get('redirect') || '/dashboard';
      
      console.log('Redirect destination:', redirectTo);
      
      const redirectUrl = isVerification 
        ? `${BASE_URL}${redirectTo}?steam_verified=success`
        : `${BASE_URL}${redirectTo}?steam_auth=success&user_id=${userId}`;
      
      console.log('Final redirect URL:', redirectUrl);
      
      const response = NextResponse.redirect(redirectUrl);
      
      // Get user data for session
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('id, email, role, username')
        .eq('id', userId)
        .single();

      if (userDataError) {
        console.error('Failed to get user data for session:', userDataError);
        return NextResponse.redirect(`${BASE_URL}/sign-in?error=session_create_failed`);
      }

      // Create session object matching auth-utils format
      const sessionData = {
        user_id: userData.id,
        email: userData.email,
        role: userData.role || 'user',
        expires_at: Date.now() + (60 * 60 * 24 * 7 * 1000) // 7 days from now
      };

      console.log('Creating session data:', sessionData);

      // Log existing cookies before setting new ones
      const existingCookies = request.cookies;
      console.log('Existing cookies before setting:', existingCookies.getAll());

      // Clear any existing session cookies first to prevent conflicts
      response.cookies.set('equipgg_session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/'
      });
      
      response.cookies.set('equipgg_session_client', '', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/'
      });
      
      console.log('Cleared existing session cookies');
      
      // Set proper session cookie in JSON format (httpOnly for security)
      response.cookies.set('equipgg_session', encodeURIComponent(JSON.stringify(sessionData)), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
      });
      
      // Also set a client-readable session cookie for the AuthProvider
      console.log('About to set equipgg_session_client cookie');
      response.cookies.set('equipgg_session_client', encodeURIComponent(JSON.stringify(sessionData)), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
      });
      console.log('equipgg_session_client cookie set successfully');
      
      console.log('Session cookies set successfully');
      
      // Also set user-friendly cookies for client-side access
      response.cookies.set('equipgg_user_id', userId, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
      });
      
      response.cookies.set('equipgg_user_email', userData.email, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', 
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
      });
      
      console.log('All cookies set, about to return response');
      console.log('Response will redirect to:', redirectUrl);
      
      return response;
    } catch (error) {
      console.error('Steam auth callback error:', error);
      return NextResponse.redirect(`${BASE_URL}/sign-in?error=steam_auth_failed`);
    }
  }
  // Initiate Steam authentication
  const url = new URL(request.url);
  const redirectParam = url.searchParams.get('redirect');
  
  // Include redirect parameter in the return URL so it's preserved through Steam auth
  const returnUrl = redirectParam 
    ? `${BASE_URL}/api/auth/steam?redirect=${encodeURIComponent(redirectParam)}`
    : `${BASE_URL}/api/auth/steam`;
    
  const steamAuthUrl = buildSteamAuthUrl(returnUrl);
  return NextResponse.redirect(steamAuthUrl);
}

// Handle POST request - for manual verification if needed
export async function POST(request: NextRequest) {
  try {
    const { steamId } = await request.json();
    if (!steamId) {
      return NextResponse.json({ error: 'Steam ID is required' }, { status: 400 });
    }
    // Get Steam user info
    const steamUser = await getSteamUserInfo(steamId);
    if (!steamUser) {
      return NextResponse.json({ error: 'Steam user not found' }, { status: 404 });
    }
    // Look up or create user in Supabase
    const email = `${steamUser.steamId}@steam.local`;
    let userId = null;
    const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      return NextResponse.json({ error: 'Supabase user list failed' }, { status: 500 });
    }
    const found = userList?.users?.find((u: any) => u.email === email);
    if (found) {
      userId = found.id;
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          displayName: steamUser.username,
          avatar: steamUser.avatar,
          steamId: steamUser.steamId,
          steamProfile: steamUser.profileUrl
        }
      });
    } else {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          displayName: steamUser.username,
          avatar: steamUser.avatar,
          steamId: steamUser.steamId,
          steamProfile: steamUser.profileUrl
        }
      });
      if (createError || !newUser || !newUser.user) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
      userId = newUser.user.id;
      await supabase.from('users').upsert({
        id: userId,
        email: email,
        display_name: steamUser.username,
        avatar_url: steamUser.avatar,
        role: 'user',
        steam_id: steamUser.steamId,
        steam_verified: true
      }, { onConflict: 'id' });
    }
    
    // Create session and set cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        displayName: steamUser.username,
        avatar_url: steamUser.avatar,
        role: 'user'
      }
    });

    // Create session object matching auth-utils format
    const sessionData = {
      user_id: userId,
      email: email,
      role: 'user',
      expires_at: Date.now() + (60 * 60 * 24 * 7 * 1000) // 7 days from now
    };

    // Set session cookie for middleware authentication in JSON format
    response.cookies.set('equipgg_session', encodeURIComponent(JSON.stringify(sessionData)), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    // Also set a client-readable session cookie for the AuthProvider
    response.cookies.set('equipgg_session_client', encodeURIComponent(JSON.stringify(sessionData)), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Steam auth POST error:', error);
    return NextResponse.json({ error: 'Steam authentication failed' }, { status: 500 });
  }
}