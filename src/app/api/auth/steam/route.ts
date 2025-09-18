import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login';
const STEAM_API_KEY = process.env.STEAM_API_KEY;
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:9002';

// Steam OpenID parameters
function buildSteamAuthUrl(returnUrl: string) {
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
async function verifySteamResponse(params: URLSearchParams): Promise<string | null> {
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
async function getSteamUserInfo(steamId: string) {
  if (!STEAM_API_KEY) {
    console.warn('Steam API key not configured, using fallback profile data');
    return {
      steamid: steamId,
      personaname: `Player_${steamId.slice(-4)}`,
      avatar: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb.jpg',
      profileurl: `https://steamcommunity.com/profiles/${steamId}`
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
  
  // If this is a callback from Steam
  if (searchParams.has('openid.mode')) {
    try {
      const steamId = await verifySteamResponse(searchParams);
      if (!steamId) {
        return NextResponse.redirect(`${BASE_URL}/signin?error=steam_verification_failed`);
      }
      // Get Steam user info
      const steamUser = await getSteamUserInfo(steamId);
      if (!steamUser) {
        return NextResponse.redirect(`${BASE_URL}/signin?error=steam_api_failed`);
      }
      // Use Supabase Admin API to upsert user by steamId (email as steamId@steam.local)
      const email = `${steamUser.steamId}@steam.local`;
      let user = null;
      // Try to find user by email (Supabase Admin API does not have getUserByEmail, so list and filter)
      let steamUserRecord = null;
      const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        return NextResponse.redirect(`${BASE_URL}/signin?error=supabase_user_list_failed`);
      }
      const found = userList?.users?.find((u: any) => u.email === email);
      if (found) {
        steamUserRecord = found;
        // Optionally update user metadata
        await supabase.auth.admin.updateUserById(steamUserRecord.id, {
          user_metadata: {
            displayName: steamUser.username,
            avatar: steamUser.avatar,
            steamId: steamUser.steamId,
            steamProfile: steamUser.profileUrl
          }
        });
      } else {
        // Create new user
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
          return NextResponse.redirect(`${BASE_URL}/signin?error=supabase_user_create_failed`);
        }
        steamUserRecord = newUser.user;
      }
      // Create a new session for the Steam user
      const { data: session, error: sessionError } = await supabase.auth.admin.createSession({
        user_id: steamUserRecord.id
      });

      if (sessionError || !session) {
        return NextResponse.redirect(`${BASE_URL}/signin?error=session_creation_failed`);
      }

      // Set session cookie and redirect to dashboard
      return NextResponse.redirect(`${BASE_URL}/dashboard`, {
        headers: {
          'Set-Cookie': `sb-session=${session.session.access_token}; Path=/; HttpOnly; SameSite=Lax`
        }
      });
    } catch (error) {
      console.error('Steam auth callback error:', error);
      return NextResponse.redirect(`${BASE_URL}/signin?error=steam_auth_failed`);
    }
  }
  
  // Initiate Steam authentication
  const returnUrl = `${BASE_URL}/api/auth/steam`;
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
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('steam_id', steamUser.steamId)
      .single();
    
    let user;
    if (!existingUser) {
      // Create new user in auth
      const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          displayName: steamUser.username,
          avatar: steamUser.avatar,
          steamId: steamUser.steamId,
          steamProfile: steamUser.profileUrl
        }
      });

      if (createError || !authUser?.user) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }

      // Create user profile in users table
      const { data: newUser, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          email: email,
          display_name: steamUser.username,
          avatar_url: steamUser.avatar,
          role: 'user',
          steam_id: steamUser.steamId,
          steam_username: steamUser.username,
          steam_avatar: steamUser.avatar
        })
        .select()
        .single();

      if (profileError || !newUser) {
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
      }

      user = newUser;
    }
    
    // Session management handled by Supabase Auth
    // No need for manual session creation
    
    
    // Redirect to dashboard on successful auth
    return NextResponse.redirect(`${BASE_URL}/dashboard`);    return NextResponse.json({
      success: true,
      user: {
        id: user?.id as string,
        email: user?.email as string,
        displayName: user?.displayName as string,
        avatar_url: user?.avatar_url as string,
        role: user?.role as string
      }
    });
    
  } catch (error) {
    console.error('Steam auth POST error:', error);
    return NextResponse.json({ error: 'Steam authentication failed' }, { status: 500 });
  }
}