import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Prefer explicit env fallbacks so local vs hosting envs work
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

function makeMissingClientProxy(name: string) {
  // return a proxy that throws a descriptive error when any method is called
  const handler = {
    get(_target: any, prop: string) {
      return (..._args: any[]) => {
        throw new Error(`${name} is not configured: missing SUPABASE env vars (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY).\n` +
          `Set the variables in your environment (do not paste secrets into logs).`);
      };
    }
  };
  return new Proxy({}, handler) as any;
}

if (!supabaseUrl || !supabaseAnonKey) {
  // Don't throw at module import time — that causes Next.js to return 500 for any route that imports this file.
  // Instead log a clear warning and export a stub client that will throw when used (so the error is easier to trace).
  // This helps in environments where envs are not loaded into the running process yet.
  // NOTE: do NOT log secret values.
  // eslint-disable-next-line no-console
  console.warn('Supabase environment variables are not fully configured. NEXT_PUBLIC_SUPABASE_URL present=', !!supabaseUrl, 'anonKey present=', !!supabaseAnonKey);
}

// Client-side Supabase client (or a helpful stub when not configured)
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : makeMissingClientProxy('Supabase client');

// Server-side Supabase client with service role (for API routes only)
export function createServerSupabaseClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // If env vars are missing, return a proxy that will throw when first used.
  // This prevents Next.js from aborting build-time module evaluation while
  // still giving an actionable error when the admin client is actually invoked at runtime.
  if (!supabaseUrl || !serviceRoleKey) {
    return makeMissingClientProxy('Supabase admin client');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Create a request-scoped Supabase client that can optionally be bound to a user's
// access token. Use this in API routes when you need queries executed as the
// authenticated user (so Row Level Security policies apply correctly).
export function createRequestSupabaseClient(token?: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('createRequestSupabaseClient: missing SUPABASE env vars');
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  if (token) {
    try {
      // Set the user's access token for the client so queries run under their identity
      // supabase-js v2 exposes auth.setAuth
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      client.auth.setAuth(token);
    } catch (e) {
      // Non-fatal: fall back to unauthenticated client if setAuth not available
      // eslint-disable-next-line no-console
      console.warn('createRequestSupabaseClient: failed to set auth token on client');
    }
  }

  return client;
}

// Helper function to get authenticated user from session cookie
export async function getAuthenticatedUser(request?: Request) {
  try {
    // In API routes, we need to read cookies from the request headers
    const cookieHeader = request?.headers.get('cookie') || '';
    const cookieMatch = cookieHeader.match(/equipgg_session=([^;]+)/);
    
    if (!cookieMatch) {
      return { user: null, error: 'No session cookie found' };
    }

    const sessionData = JSON.parse(decodeURIComponent(cookieMatch[1]));
    
    // Check if session is expired
    if (sessionData.expires_at && Date.now() > sessionData.expires_at) {
      return { user: null, error: 'Session expired' };
    }

    // Get user from database using service role client
    const supabase = createServerSupabaseClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', sessionData.user_id)
      .single();

    if (error || !user) {
      return { user: null, error: 'User not found' };
    }

    return { user, error: null };
  } catch (error) {
    return { user: null, error: 'Invalid session cookie' };
  }
}
