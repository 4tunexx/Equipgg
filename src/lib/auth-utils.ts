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
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Try to get from cookies
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const sessionMatch = cookies.match(/sb-access-token=([^;]+)/);
        if (sessionMatch) {
          token = sessionMatch[1];
        }
      }
    }
    
    if (!token) {
      return null;
    }
    
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.log('Token verification failed:', error?.message);
      return null;
    }
    
    // Get user profile to include role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
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

export function createUnauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function createForbiddenResponse(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}
