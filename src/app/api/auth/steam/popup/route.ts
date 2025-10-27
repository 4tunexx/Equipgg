import { NextRequest, NextResponse } from 'next/server';
import { buildSteamAuthUrl, verifySteamResponse, getSteamUserInfo } from '../route';
import { createServerSupabaseClient } from '@/lib/supabase';

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

function returnHtml(success: boolean, error?: string, data?: any) {
  return new NextResponse(`
    <!DOCTYPE html>
    <html>
    <head>
      <script>
        if (window.opener) {
          window.opener.postMessage({
            type: 'steam_auth_complete',
            success: ${success},
            ${error ? `error: "${error}",` : ''}
            ${data ? `...${JSON.stringify(data)},` : ''}
          }, '*');
        }
        setTimeout(() => window.close(), 100);
      </script>
    </head>
    <body>
      <p>${success ? 'Authentication successful!' : error || 'Authentication failed.'}</p>
      <p>This window will close automatically...</p>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const baseUrl = getBaseUrl(request);
  
  // Handle Steam callback
  if (searchParams.has('openid.mode')) {
    try {
      console.log('=== POPUP ROUTE: HANDLING STEAM CALLBACK ===');
      const steamId = await verifySteamResponse(searchParams);
      if (!steamId) {
        return returnHtml(false, 'Steam verification failed');
      }
      
      const steamUser = await getSteamUserInfo(steamId);
      if (!steamUser) {
        return returnHtml(false, 'Failed to get Steam user info');
      }
      
      // Get verification user ID from return URL
      const verifyUserId = searchParams.get('verify_user');
      let userData;
      
      if (verifyUserId) {
        console.log('Handling verification flow for user:', verifyUserId);
        // Verification flow
        const { data: conflicts } = await supabase
          .from('users')
          .select('id')
          .eq('steam_id', steamUser.steamId)
          .neq('id', verifyUserId)
          .limit(1);
        
        if (conflicts && conflicts.length > 0) {
          return returnHtml(false, 'This Steam account is already linked to another EquipGG account');
        }
        
        // Update user with Steam info
        const { error: updateError } = await supabase
          .from('users')
          .update({
            steam_id: steamUser.steamId,
            steam_verified: true,
            account_status: 'active',
            username: steamUser.username,
            avatar_url: steamUser.avatar,
            last_login_at: new Date().toISOString()
          })
          .eq('id', verifyUserId);
        
        if (updateError) {
          console.error('Failed to update user:', updateError);
          return returnHtml(false, 'Failed to update user account');
        }
        
        // Get updated user data
        const { data: verifiedUser, error: userDataError } = await supabase
          .from('users')
          .select('id, email, role, username, steam_id, steam_verified, avatar_url')
          .eq('id', verifyUserId)
          .single();
        
        if (userDataError) {
          console.error('Failed to get user data:', userDataError);
          return returnHtml(false, 'Failed to get user data');
        }
        
        userData = verifiedUser;
      } else {
        console.log('Handling login flow for Steam ID:', steamId);
        // Login flow - check if Steam ID exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id, email, role, username, steam_id, steam_verified, avatar_url')
          .eq('steam_id', steamId)
          .single();
        
        if (existingUser) {
          console.log('Found existing user:', existingUser.id);
          // Update last login
          await supabase
            .from('users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', existingUser.id);
          
          userData = existingUser;
        } else {
          console.log('Creating new user for Steam ID:', steamId);
          // Create new user
          const newUserId = `steam-${steamId}`;
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              id: newUserId,
              email: `${steamId}@steam.local`,
              username: steamUser.username,
              avatar_url: steamUser.avatar,
              role: 'user',
              coins: 50,
              xp: 0,
              level: 1,
              steam_id: steamId,
              steam_verified: true,
              account_status: 'active',
              created_at: new Date().toISOString(),
              last_login_at: new Date().toISOString()
            })
            .select('id, email, role, username, steam_id, steam_verified, avatar_url')
            .single();
          
          if (createError || !newUser) {
            console.error('Failed to create Steam user:', createError);
            return returnHtml(false, 'Failed to create user account');
          }
          
          userData = newUser;
        }
      }
      
      // Create session object
      const sessionData = {
        user_id: userData.id,
        email: userData.email,
        role: userData.role || 'user',
        provider: 'steam',
        avatarUrl: userData.avatar_url,
        steamProfile: {
          steamId: userData.steam_id,
          avatar: userData.avatar_url,
          profileUrl: `https://steamcommunity.com/profiles/${userData.steam_id}`
        },
        steamVerified: userData.steam_verified || true,
        displayName: userData.username,
        expires_at: Date.now() + (60 * 60 * 24 * 7 * 1000) // 7 days
      };
      
      // Set cookies in the response
      const isSecure = process.env.NODE_ENV === 'production' || 
                      request.headers.get('host')?.includes('.app.github.dev') ||
                      request.headers.get('x-forwarded-proto') === 'https';
      
      const host = request.headers.get('host');
      const domain = host?.includes('.app.github.dev') 
        ? host 
        : undefined; // Let browser set domain for localhost/production
      
      const response = returnHtml(true, undefined, {
        steamId: steamUser.steamId,
        username: steamUser.username,
        avatar: steamUser.avatar,
        redirect: searchParams.get('redirect') || '/dashboard',
        userId: userData.id
      });
      
      // Clear existing cookies first
      const clearOptions = {
        httpOnly: true,
        secure: isSecure,
        sameSite: isSecure ? 'none' as const : 'lax' as const,
        path: '/',
        domain,
        maxAge: 0
      };
      
      response.cookies.set('equipgg_session', '', clearOptions);
      response.cookies.set('equipgg_session_client', '', { ...clearOptions, httpOnly: false });
      response.cookies.set('equipgg_user_id', '', { ...clearOptions, httpOnly: false });
      response.cookies.set('equipgg_user_email', '', { ...clearOptions, httpOnly: false });
      
      // Set new cookies
      const cookieOptions = {
        httpOnly: true,
        secure: isSecure,
        sameSite: isSecure ? 'none' as const : 'lax' as const,
        path: '/',
        domain,
        maxAge: 60 * 60 * 24 * 7 // 7 days
      };
      
      response.cookies.set(
        'equipgg_session',
        encodeURIComponent(JSON.stringify(sessionData)),
        cookieOptions
      );
      
      response.cookies.set(
        'equipgg_session_client',
        encodeURIComponent(JSON.stringify(sessionData)),
        { ...cookieOptions, httpOnly: false }
      );
      
      // Set additional client cookies
      response.cookies.set(
        'equipgg_user_id', 
        userData.id,
        { ...cookieOptions, httpOnly: false }
      );
      
      response.cookies.set(
        'equipgg_user_email',
        userData.email,
        { ...cookieOptions, httpOnly: false }
      );
      
      return response;
    } catch (error) {
      console.error('Steam auth popup callback error:', error);
      return returnHtml(false, 'Internal server error');
    }
  }
  
  // Start Steam auth flow
  const verifyUserId = searchParams.get('verify_user');
  if (!verifyUserId) {
    return NextResponse.json({ error: 'No user ID provided' }, { status: 400 });
  }
  
  const redirectParam = searchParams.get('redirect');
  const returnUrl = redirectParam
    ? `${baseUrl}/api/auth/steam/popup?verify_user=${verifyUserId}&redirect=${encodeURIComponent(redirectParam)}`
    : `${baseUrl}/api/auth/steam/popup?verify_user=${verifyUserId}`;
  
  const steamAuthUrl = buildSteamAuthUrl(returnUrl, baseUrl);
  return NextResponse.redirect(steamAuthUrl);
}