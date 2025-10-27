import { NextRequest, NextResponse } from 'next/server';
import { supabase } from './supabase';

export interface AuthSession {
  user_id: string;
  email: string;
  role: string;
}

export interface SessionData {
  user_id: string;
  email: string;
  role: string;
  expires_at: number;
  access_token: string;
}

export interface AuthSessionWithToken {
  session: AuthSession | null;
  token: string | null;
}

// use shared supabase client from `src/lib/supabase` which handles env presence

export function createUnauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function createForbiddenResponse(message: string = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function getAuthSessionWithToken(request: NextRequest): Promise<AuthSessionWithToken> {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    let token: string | null = null;
    let sessionData: SessionData | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Try to get from cookies using Next.js cookies API
      const equipggCookie = request.cookies.get('equipgg_session') || request.cookies.get('equipgg_session_client');
      
      if (equipggCookie) {
        try {
          const rawCookieValue = equipggCookie.value;
          let decodedValue = decodeURIComponent(rawCookieValue);
          
          // Try to parse, if it fails, try double decode for localhost
          try {
            sessionData = JSON.parse(decodedValue) as SessionData;
          } catch {
            try {
              decodedValue = decodeURIComponent(decodedValue);
              sessionData = JSON.parse(decodedValue) as SessionData;
            } catch (secondParseError) {
              throw secondParseError;
            }
          }
          
          // Check if session is still valid
          if (sessionData && sessionData.expires_at && Date.now() < sessionData.expires_at) {
            return {
              session: {
                user_id: sessionData.user_id,
                email: sessionData.email,
                role: sessionData.role
              },
              token: sessionData.access_token || null
            };
          } else {
            return { session: null, token: null };
          }
        } catch (parseError) {
          // If it's not JSON, treat it as a raw token (backward compatibility)
          token = equipggCookie.value;
        }
      } else {
        // Fallback to header parsing for backward compatibility
        const cookies = request.headers.get('cookie');
        
        if (cookies) {
          // First try our custom cookie name (JSON format)
          const equipggMatch = cookies.match(/equipgg_session=([^;]+)/);
          
          if (equipggMatch) {
            try {
              const rawCookieValue = equipggMatch[1];
              let decodedValue = decodeURIComponent(rawCookieValue);
              
              // Try to parse, if it fails, try double decode for localhost
              try {
                sessionData = JSON.parse(decodedValue) as SessionData;
              } catch {
                try {
                  decodedValue = decodeURIComponent(decodedValue);
                  sessionData = JSON.parse(decodedValue) as SessionData;
                } catch (secondParseError) {
                  throw secondParseError;
                }
              }
              
              // Check if session is still valid
              if (sessionData && sessionData.expires_at && Date.now() < sessionData.expires_at) {
                return {
                  session: {
                    user_id: sessionData.user_id,
                    email: sessionData.email,
                    role: sessionData.role
                  },
                  token: sessionData.access_token || null
                };
              } else {
                return { session: null, token: null };
              }
            } catch (parseError) {
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
      return { session: null, token: null };
    }

    // Verify the token with Supabase (fallback for raw tokens)
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { session: null, token: null };
    }
    
    // Get user profile to include role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    return {
      session: {
        user_id: user.id,
        email: user.email || '',
        role: profile?.role || 'user'
      },
      token
    };
  } catch (error) {
    console.error('Auth session error:', error);
    return { session: null, token: null };
  }
}

// Backwards-compatible wrapper: returns only the AuthSession (or null)
export async function getAuthSession(request: NextRequest): Promise<AuthSession | null> {
  const res = await getAuthSessionWithToken(request);
  return res.session;
}