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

export async function getAuthSession(request: NextRequest): Promise<AuthSession | null> {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    let token = null;
    let sessionData = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Try to get from cookies
      const cookies = request.headers.get('cookie');
      if (cookies) {
        // First try our custom cookie name (JSON format)
        const equipggMatch = cookies.match(/equipgg_session=([^;]+)/);
        if (equipggMatch) {
          try {
            sessionData = JSON.parse(decodeURIComponent(equipggMatch[1]));
            // Check if session is still valid
            if (sessionData.expires_at && Date.now() < sessionData.expires_at) {
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
    
    if (!token) {
      return null;
    }
    
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

export function createUnauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function createForbiddenResponse(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}
