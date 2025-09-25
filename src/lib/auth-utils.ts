import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export interface AuthSession {
  user_id: string;
  email: string;
  role: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export function createUnauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function createForbiddenResponse(message: string = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function getAuthSession(request: NextRequest): Promise<AuthSession | null> {
  try {
    console.log('=== AUTH SESSION DEBUG ===');
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    let token = null;
    let sessionData = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('Found Bearer token');
    } else {
      // Try to get from cookies using Next.js cookies API
      console.log('Next.js cookies:', request.cookies.getAll());
      
      const equipggCookie = request.cookies.get('equipgg_session');
      console.log('equipgg_session cookie:', equipggCookie);
      console.log('equipgg_session cookie value:', equipggCookie?.value);
      
      if (equipggCookie) {
        try {
          const rawCookieValue = equipggCookie.value;
          console.log('Raw cookie value:', rawCookieValue);
          let decodedValue = decodeURIComponent(rawCookieValue);
          console.log('Single decoded cookie value:', decodedValue);
          
          // Try to parse, if it fails, try double decode for localhost
          try {
            sessionData = JSON.parse(decodedValue);
          } catch (firstParseError) {
            console.log('Single decode parse failed, trying double decode');
            try {
              decodedValue = decodeURIComponent(decodedValue);
              console.log('Double decoded cookie value:', decodedValue);
              sessionData = JSON.parse(decodedValue);
              console.log('Double decode successful');
            } catch (secondParseError) {
              console.log('Double decode also failed:', secondParseError);
              throw secondParseError;
            }
          }
          
          console.log('Parsed session data:', sessionData);
          
          // Check if session is still valid
          if (sessionData.expires_at && Date.now() < sessionData.expires_at) {
            console.log('Session is valid, returning session');
            return {
              user_id: sessionData.user_id,
              email: sessionData.email,
              role: sessionData.role
            };
          } else {
            console.log('Session expired');
            return null;
          }
        } catch (parseError) {
          console.log('JSON parse error:', parseError);
          // If it's not JSON, treat it as a raw token (backward compatibility)
          token = equipggCookie.value;
        }
      } else {
        // Fallback to header parsing for backward compatibility
        const cookies = request.headers.get('cookie');
        console.log('Cookies header:', cookies);
        
        if (cookies) {
          // First try our custom cookie name (JSON format)
          const equipggMatch = cookies.match(/equipgg_session=([^;]+)/);
          console.log('equipgg_session match:', equipggMatch);
          
          if (equipggMatch) {
            try {
              const rawCookieValue = equipggMatch[1];
              console.log('Raw cookie value:', rawCookieValue);
              let decodedValue = decodeURIComponent(rawCookieValue);
              console.log('Single decoded cookie value:', decodedValue);
              
              // Try to parse, if it fails, try double decode for localhost
              try {
                sessionData = JSON.parse(decodedValue);
              } catch (firstParseError) {
                console.log('Single decode parse failed, trying double decode');
                try {
                  decodedValue = decodeURIComponent(decodedValue);
                  console.log('Double decoded cookie value:', decodedValue);
                  sessionData = JSON.parse(decodedValue);
                  console.log('Double decode successful');
                } catch (secondParseError) {
                  console.log('Double decode also failed:', secondParseError);
                  throw secondParseError;
                }
              }
              
              console.log('Parsed session data:', sessionData);
              
              // Check if session is still valid
              if (sessionData.expires_at && Date.now() < sessionData.expires_at) {
                console.log('Session is valid, returning session');
                return {
                  user_id: sessionData.user_id,
                  email: sessionData.email,
                  role: sessionData.role
                };
              } else {
                console.log('Session expired');
                return null;
              }
            } catch (parseError) {
              console.log('JSON parse error:', parseError);
              // If it's not JSON, treat it as a raw token (backward compatibility)
              token = equipggMatch[1];
            }
          } else {
            // Fallback to Supabase standard cookie name
            const sessionMatch = cookies.match(/sb-access-token=([^;]+)/);
            if (sessionMatch) {
              token = sessionMatch[1];
            }
          }
        }
      }
    }
    
    if (!token) {
      console.log('No token found, returning null');
      return null;
    }
    
    console.log('Proceeding to token verification with token:', token);
    // Verify the token with Supabase (fallback for raw tokens)
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.log('Token verification failed:', error?.message);
      return null;
    }
    
    // Get user profile to include role
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.log('Profile fetch failed:', profileError.message);
    }
    
    return {
      user_id: user.id,
      email: user.email || '',
      role: profile?.role || 'user'
    };
  } catch (error) {
    console.error('Auth session error:', error);
    return null;
  }
}