import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { checkAndResetDailyMissions, awardDailyLoginMission } from '@/lib/mission-integration';

const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login';
const STEAM_API_KEY = process.env.STEAM_API_KEY;

function getBaseUrl(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const isCodespaces = host.includes('.app.github.dev');
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isCodespaces) {
    // GitHub Codespaces - use the provided hostname
    return `https://${host}`;
  } else if (isProduction) {
    // Production environment
    return 'https://www.equipgg.net';
  } else {
    // Local development - always use localhost:3001
    return 'http://localhost:3001';
  }
}

export function buildSteamAuthUrl(returnUrl: string, baseUrl: string) {
  // Ensure the return URL is absolute and encoded
  let absoluteReturnUrl = returnUrl.startsWith('http') ? returnUrl : `${baseUrl}${returnUrl}`;
  
  // Keep only allowed params from the return URL
  const returnUrlObj = new URL(absoluteReturnUrl);
  const allowedParams = ['redirect', 'verify_user'];
  const filteredParams = new URLSearchParams();
  
  for (const [key, value] of returnUrlObj.searchParams.entries()) {
    if (allowedParams.includes(key)) {
      filteredParams.append(key, value);
    }
  }
  
  // Build the clean return URL
  const cleanReturnUrl = `${returnUrlObj.origin}${returnUrlObj.pathname}${
    filteredParams.toString() ? '?' + filteredParams.toString() : ''
  }`;
  
  console.log('Building Steam auth URL with:', { cleanReturnUrl, baseUrl });
  
  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': cleanReturnUrl,
    'openid.realm': baseUrl,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
  });
  
  return `${STEAM_OPENID_URL}?${params.toString()}`;
}

export async function verifySteamResponse(params: URLSearchParams): Promise<string | null> {
  try {
    console.log('=== VERIFYING STEAM RESPONSE ===');
    console.log('Original params:', Object.fromEntries(params.entries()));
    
    const verifyParams = new URLSearchParams(params);
    verifyParams.set('openid.mode', 'check_authentication');
    console.log('Verify params:', Object.fromEntries(verifyParams.entries()));
    
    const response = await fetch(STEAM_OPENID_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: verifyParams.toString()
    });
    
    const text = await response.text();
    console.log('Steam verification response:', text);
    
    if (!text.includes('is_valid:true')) {
      console.error('Steam verification failed - invalid response');
      return null;
    }
    
    const claimedId = params.get('openid.claimed_id');
    console.log('Claimed ID:', claimedId);
    
    if (!claimedId) {
      console.error('No claimed ID found in response');
      return null;
    }
    
    const steamId = claimedId.replace('https://steamcommunity.com/openid/id/', '');
    console.log('Extracted Steam ID:', steamId);
    return steamId;
  } catch (error) {
    console.error('Steam verification error:', error);
    return null;
  }
}

export async function getSteamUserInfo(steamId: string) {
  if (!STEAM_API_KEY) {
    console.warn('Steam API key not configured, using fallback profile data');
    return {
      steamId,
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
    
    if (!data.response?.players?.length) return null;
    
    const player = data.response.players[0];
    return {
      steamId: player.steamid,
      username: player.personaname,
      avatar: player.avatarfull || player.avatarmedium || player.avatar,
      profileUrl: player.profileurl
    };
  } catch (error) {
    console.error('Steam API error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const baseUrl = getBaseUrl(request);
  
  // If this is a callback from Steam
  if (searchParams.has('openid.mode')) {
    try {
      const steamId = await verifySteamResponse(searchParams);
      if (!steamId) {
        return NextResponse.redirect(`${baseUrl}/sign-in?error=steam_verification_failed`);
      }
      
      const steamUser = await getSteamUserInfo(steamId);
      if (!steamUser) {
        return NextResponse.redirect(`${baseUrl}/sign-in?error=steam_api_failed`);
      }
      
      let userId: string | null = null;
      let isVerification = false;
      
      // Check if Steam ID is already linked
      const { data: existingSteamUsers, error: steamLookupError } = await supabase
        .from('users')
        .select('id, email, steam_id')
        .eq('steam_id', steamUser.steamId)
        .limit(1);
      
      if (steamLookupError) {
        console.error('Failed to lookup Steam user:', steamLookupError);
        return NextResponse.redirect(`${baseUrl}/sign-in?error=steam_lookup_failed`);
      }
      
      if (existingSteamUsers && existingSteamUsers.length > 0) {
        // Steam ID already linked to an account
        userId = existingSteamUsers[0].id;
        await supabase.from('users').update({
          username: steamUser.username,
          avatar_url: steamUser.avatar,
          last_login_at: new Date().toISOString()
        }).eq('id', userId);
      } else {
        // Check for verification request or create new account
        const verifyUserId = searchParams.get('verify_user');
        
        if (verifyUserId) {
          // Verifying existing account
          const { data: conflicts } = await supabase
            .from('users')
            .select('id')
            .eq('steam_id', steamUser.steamId)
            .neq('id', verifyUserId)
            .limit(1);
          
          if (conflicts && conflicts.length > 0) {
            return NextResponse.redirect(`${baseUrl}/dashboard?error=steam_already_linked`);
          }
          
          const { error: verifyError } = await supabase
            .from('users')
            .update({
              steam_id: steamUser.steamId,
              steam_verified: true,
              account_status: 'active',
              username: steamUser.username,
              avatar_url: steamUser.avatar
            })
            .eq('id', verifyUserId);
          
          if (verifyError) {
            console.error('Failed to verify Steam for user:', verifyError);
            return NextResponse.redirect(`${baseUrl}/dashboard?error=steam_verification_failed`);
          }
          
          userId = verifyUserId;
          isVerification = true;
        } else {
          // New Steam-only registration
          const steamUuid = `steam-${steamUser.steamId}`;
          const email = `${steamUser.steamId}@steam.local`;
          
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('id', steamUuid)
            .single();
          
          if (existingUser) {
            // Update existing user
            userId = steamUuid;
            await supabase.from('users').update({
              email,
              username: steamUser.username,
              avatar_url: steamUser.avatar,
              steam_id: steamUser.steamId,
              steam_verified: true,
              account_status: 'active',
              last_login_at: new Date().toISOString()
            }).eq('id', steamUuid);
          } else {
            // Create new user
            const { data: newUser, error: createError } = await supabase
              .from('users')
              .insert({
                id: steamUuid,
                email,
                username: steamUser.username,
                avatar_url: steamUser.avatar,
                role: 'user',
                coins: 50,
                xp: 0,
                level: 1,
                steam_id: steamUser.steamId,
                steam_verified: true,
                account_status: 'active',
                created_at: new Date().toISOString(),
                last_login_at: new Date().toISOString()
              })
              .select('id')
              .single();
            
            if (createError || !newUser) {
              console.error('Failed to create Steam user:', createError);
              return NextResponse.redirect(`${baseUrl}/sign-in?error=user_create_failed`);
            }
            
            userId = newUser.id;
          }
        }
      }
      
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      const redirectUrl = isVerification 
        ? `${baseUrl}${redirectTo}?steam_verified=success`
        : `${baseUrl}${redirectTo}?steam_auth=success&user_id=${userId}`;
      
      const response = NextResponse.redirect(redirectUrl);
      
      // Get full user data for session
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('id, email, role, username, avatar_url, steam_id, steam_verified, displayname')
        .eq('id', userId)
        .single();
      
      if (userDataError) {
        console.error('Failed to get user data for session:', userDataError);
        return NextResponse.redirect(`${baseUrl}/sign-in?error=session_create_failed`);
      }
      
      // Create session data
      const sessionData = {
        user_id: userData.id,
        email: userData.email,
        role: userData.role || 'user',
        provider: 'steam',
        avatarUrl: userData.avatar_url,
        steamProfile: {
          steamId: userData.steam_id,
          avatar: userData.avatar_url
        },
        steamVerified: userData.steam_verified || true,
        displayName: userData.username || userData.displayname,
        expires_at: Date.now() + (60 * 60 * 24 * 7 * 1000) // 7 days
      };
      
      // Set cookie options based on environment
      const isSecure = process.env.NODE_ENV === 'production' || 
                      request.headers.get('host')?.includes('.app.github.dev') ||
                      request.headers.get('x-forwarded-proto') === 'https';
      
      const cookieOptions = {
        httpOnly: true,
        secure: isSecure,
        sameSite: isSecure ? 'none' as const : 'lax' as const,
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      };
      
      const clientCookieOptions = {
        ...cookieOptions,
        httpOnly: false
      };
      
      // Set session cookies
      response.cookies.set('equipgg_session', '', { ...cookieOptions, maxAge: 0 });
      response.cookies.set('equipgg_session_client', '', { ...clientCookieOptions, maxAge: 0 });
      
      response.cookies.set(
        'equipgg_session',
        encodeURIComponent(JSON.stringify(sessionData)),
        cookieOptions
      );
      
      response.cookies.set(
        'equipgg_session_client',
        encodeURIComponent(JSON.stringify(sessionData)),
        clientCookieOptions
      );
      
      // Set additional client cookies
      response.cookies.set('equipgg_user_id', userData.id, clientCookieOptions);
      response.cookies.set('equipgg_user_email', userData.email, clientCookieOptions);
      
      // Check and reset daily missions, award daily login mission
      try {
        await checkAndResetDailyMissions(userId);
        await awardDailyLoginMission(userId);
        console.log('✅ Daily missions reset and login mission awarded for Steam user:', userId);
      } catch (missionError) {
        console.error('⚠️ Failed to track login mission for Steam user:', missionError);
      }
      
      return response;
    } catch (error) {
      console.error('Steam auth callback error:', error);
      return NextResponse.redirect(`${baseUrl}/sign-in?error=steam_auth_failed`);
    }
  }
  
  // Initiate Steam authentication
  console.log('=== INITIATING STEAM AUTH ===');
  console.log('Base URL:', baseUrl);
  const returnUrl = `${baseUrl}/api/auth/steam${request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : ''}`;
  console.log('Return URL:', returnUrl);
  const steamAuthUrl = buildSteamAuthUrl(returnUrl, baseUrl);
  console.log('Steam Auth URL:', steamAuthUrl);
  return NextResponse.redirect(steamAuthUrl);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { steamId } = await request.json();
    
    if (!steamId) {
      return NextResponse.json({ error: 'Steam ID is required' }, { status: 400 });
    }
    
    const steamUser = await getSteamUserInfo(steamId);
    if (!steamUser) {
      return NextResponse.json({ error: 'Steam user not found' }, { status: 404 });
    }
    
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: `steam-${steamId}`,
        email: `${steamId}@steam.local`,
        username: steamUser.username,
        avatar_url: steamUser.avatar,
        role: 'user',
        steam_id: steamId,
        steam_verified: true,
        account_status: 'active',
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Failed to create Steam user:', createError);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    console.error('Steam auth POST error:', error);
    return NextResponse.json({ error: 'Steam authentication failed' }, { status: 500 });
  }
}