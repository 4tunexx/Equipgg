'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from "../lib/supabase";
import { useToast } from "../hooks/use-toast";
import type { Session } from '@supabase/supabase-js';



export type LocalUser = {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  photoURL?: string;
  role?: string;
  level?: number;
  xp?: number;
  provider?: 'steam' | 'default';
  steam_verified?: boolean;
  account_status?: string;
  equipped_banner?: string;
  steamProfile?: {
    steamId?: string;
    avatar?: string;
    profileUrl?: string;
  };
};

export type AuthContextValue = {
  user: LocalUser | null;
  session: Session | null;
  loading: boolean;
  enabled: boolean;
  signIn: (email: string, password: string) => Promise<{ session: Session; user: LocalUser }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ session?: Session; user?: LocalUser; emailVerificationRequired?: boolean }>;
  signOutUser: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  enabled: true,
  async signIn() { return { session: {} as Session, user: {} as LocalUser }; },
  async signUp() { return {}; },
  async signOutUser() {},
  async refreshUser() {},
});



function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();





  useEffect(() => {
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Check if we're currently logging out - if so, don't process session
      if (sessionStorage.getItem('equipgg_logging_out') === 'true') {
        console.log('Currently logging out, ignoring session change');
        // Clear the flag after a delay
        setTimeout(() => {
          sessionStorage.removeItem('equipgg_logging_out');
        }, 1000);
        return;
      }
      
      setSession(session);
      setLoading(true);

      // DEVELOPMENT OVERRIDE: If localhost and we have any Steam-related cookies, just log in
      if (process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost') {
        const steamUserId = getCookie('equipgg_user_id');
        const steamUserEmail = getCookie('equipgg_user_email');
        
        if (steamUserId && steamUserEmail) {
          console.log('DEVELOPMENT MODE: Auto-login with Steam cookies');
          // For now, just skip the development override to prevent hardcoded data issues
          console.log('Skipping development override to prevent hardcoded Steam ID issues');
          // Continue to normal authentication flow instead of using cookie data
        }
      }

      if (session?.user) {
        // Fetch additional user data from profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setUser({
          id: session.user.id,
          email: session.user.email || '',
          username: profile?.username,
          displayName: profile?.displayname || session.user.user_metadata?.displayName || session.user.user_metadata?.displayname,
          photoURL: profile?.avatar_url || session.user.user_metadata?.avatar,
          role: profile?.role || 'user',
          level: profile?.level || 1,
          xp: profile?.xp || 0,
          provider: (session.user.app_metadata?.provider as 'steam' | 'default') || 'default',
          steam_verified: profile?.steam_verified || false,
          account_status: profile?.account_status || 'active',
          steamProfile: session.user.user_metadata?.steamProfile
        });
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // Check if we're currently logging out
      if (sessionStorage.getItem('equipgg_logging_out') === 'true') {
        console.log('Currently logging out, skipping session check');
        setLoading(false);
        return;
      }
      
      setSession(session);
      
      // If we have a Supabase session, use it (prioritize regular auth over Steam)
      if (session) {
        console.log('Found Supabase session, clearing any Steam cookies');
        // Clear Steam cookies to prevent conflicts
        document.cookie = 'equipgg_steam_session=; Max-Age=0; path=/';
        document.cookie = 'equipgg_steam_email=; Max-Age=0; path=/';
        setLoading(false);
        return;
      }
      
      // Check for new JSON-format session cookie first
      const equipggSessionCookie = getCookie('equipgg_session_client');
      const mainSessionCookie = getCookie('equipgg_session');
      
      if (equipggSessionCookie) {
        try {
          // Handle double URL encoding by decoding twice if needed
          const cookieValue = equipggSessionCookie;
          let sessionData: any = null;
          
          try {
            // Try single decode first
            sessionData = JSON.parse(decodeURIComponent(cookieValue));
          } catch {
            console.log('Single decode failed, trying double decode');
            // If single decode fails, try double decode
            sessionData = JSON.parse(decodeURIComponent(decodeURIComponent(cookieValue)));
          }
          
          console.log('Found equipgg_session_client cookie:', sessionData);
          
          // Check if session is still valid and sessionData is not null
          if (sessionData && sessionData.expires_at && Date.now() < sessionData.expires_at) {
            console.log('Session is valid, setting user data directly');
            
            // Set user directly from session data for regular logins
            setUser({
              id: sessionData.user_id,
              email: sessionData.email,
              username: sessionData.username,
              displayName: sessionData.displayName || sessionData.displayname || sessionData.email.split('@')[0],
              photoURL: sessionData.avatarUrl || undefined,
              role: sessionData.role || 'user',
              provider: sessionData.provider || 'default',
              level: sessionData.level || 1,
              xp: sessionData.xp || 0,
              steam_verified: sessionData.steamVerified || false,
              account_status: 'active',
              steamProfile: sessionData.steamProfile || undefined
            });
            
            // If critical user data is missing from cookie, refresh from API
            if (!sessionData.avatarUrl || !sessionData.displayName) {
              console.log('Cookie missing user profile data, refreshing from /api/me');
              // Use timeout to avoid blocking the initial render
              setTimeout(() => {
                refreshUser();
              }, 100);
            }
            
            setLoading(false);
            return;
          } else {
            console.log('Session expired, clearing cookie');
            document.cookie = 'equipgg_session_client=; Max-Age=0; path=/';
            document.cookie = 'equipgg_session=; Max-Age=0; path=/';
          }
        } catch {
          console.log('Failed to parse equipgg_session_client cookie');
          document.cookie = 'equipgg_session_client=; Max-Age=0; path=/';
          document.cookie = 'equipgg_session=; Max-Age=0; path=/';
        }
      }
      
      // If no client-readable cookie, check if there's a main session cookie and validate it
      if (!equipggSessionCookie && mainSessionCookie) {
        console.log('No client cookie but found main session cookie, trying to parse directly');
        
        try {
          // Try to parse the main session cookie directly
          const sessionData = JSON.parse(decodeURIComponent(mainSessionCookie));
          console.log('Successfully parsed main session cookie:', sessionData);
          
          // Check if session is still valid
          if (sessionData.expires_at && Date.now() < sessionData.expires_at) {
            console.log('Main session is valid, setting user data directly');
            
            // Set user directly from session data for regular logins
            setUser({
              id: sessionData.user_id,
              email: sessionData.email,
              username: sessionData.username,
              displayName: sessionData.displayName || sessionData.displayname || sessionData.email.split('@')[0],
              photoURL: undefined,
              role: sessionData.role || 'user',
              provider: 'default',
              level: 1,
              xp: 0,
              steam_verified: false,
              account_status: 'active',
              steamProfile: sessionData.steamProfile || undefined
            });
            
            // Always refresh from API since main session cookie has minimal data
            console.log('Main session cookie has minimal data, refreshing from /api/me');
            setTimeout(() => {
              refreshUser();
            }, 100);
            
            setLoading(false);
            return;
          } else {
            console.log('Main session expired, clearing cookies');
            document.cookie = 'equipgg_session_client=; Max-Age=0; path=/';
            document.cookie = 'equipgg_session=; Max-Age=0; path=/';
          }
        } catch {
          console.log('Failed to parse main session cookie');
          document.cookie = 'equipgg_session_client=; Max-Age=0; path=/';
          document.cookie = 'equipgg_session=; Max-Age=0; path=/';
        }
        
        return;
      }
      
      // If no new session format, check for legacy Steam session
      const steamSession = getCookie('equipgg_steam_session');
      const steamEmail = getCookie('equipgg_steam_email');
      
      console.log('Checking for Steam cookies:');
      console.log('- steamSession:', steamSession);
      console.log('- steamEmail:', steamEmail);
      
      if (steamSession && steamEmail) {
        console.log('Found legacy Steam session, loading user data from database');
        
        // Try to load actual user data from database instead of using Steam ID as display name
        const steamUserId = steamSession.replace('steam-', '');
        console.log('Steam User ID:', steamUserId);
        
        // Fetch user data from database
        try {
          const { data: userData, error } = await supabase.from('users').select('*').eq('id', steamSession).single();
          
          if (userData && !error) {
            console.log('Found user in database, using actual user data');
            setUser({
              id: userData.id,
              email: userData.email,
              username: userData.username,
              displayName: userData.displayname || userData.username || steamUserId,
              photoURL: userData.avatar_url || undefined,
              role: userData.role || 'user',
              level: userData.level || 1,
              xp: userData.xp || 0,
              provider: userData.provider || 'steam',
              steam_verified: userData.steam_verified || false,
              account_status: userData.account_status || 'active',
              steamProfile: {
                steamId: steamUserId,
                avatar: userData.avatar_url || undefined,
                profileUrl: `https://steamcommunity.com/profiles/${steamUserId}`
              }
            });
          } else {
            console.log('User not found in database, falling back to Steam ID as display name');
            // Fallback to Steam ID as display name
            setUser({
              id: steamSession,
              email: decodeURIComponent(steamEmail),
              displayName: steamUserId, // Use Steam ID as display name - this will be fixed by /api/me refresh
              photoURL: undefined,
              role: 'user',
              level: 1,
              xp: 0,
              provider: 'steam',
              steam_verified: false,
              account_status: 'active',
              steamProfile: {
                steamId: steamUserId,
                avatar: undefined,
                profileUrl: `https://steamcommunity.com/profiles/${steamUserId}`
              }
            });
            
            // Trigger a user data refresh to get proper Steam profile data
            setTimeout(() => {
              console.log('Triggering user data refresh for Steam user...');
              refreshUser();
            }, 1000);
          }
          setLoading(false);
        } catch {
          console.error('Error loading user from database');
          // Fallback to Steam ID as display name on error
          setUser({
            id: steamSession,
            email: decodeURIComponent(steamEmail),
            displayName: steamUserId,
            photoURL: undefined,
            role: 'user',
            level: 1,
            xp: 0,
            provider: 'steam',
            steam_verified: false,
            account_status: 'active',
            steamProfile: {
              steamId: steamUserId,
              avatar: undefined,
              profileUrl: undefined
            }
          });
          setLoading(false);
        }
        
        return;
      }
      
      // If no session cookies found, try to validate session via API as a final check
      console.log('🔍 No valid cookies found, checking session via /api/me...');
      try {
        const response = await fetch('/api/me', { 
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) {
          const { user: freshUser } = await response.json();
          if (freshUser) {
            console.log('✅ API validated session, setting user data:', freshUser);
            const displayName = freshUser.displayName || freshUser.displayname || freshUser.username || '';
            const photoURL = freshUser.avatarUrl || freshUser.photoURL || '';
            
            setUser({
              id: freshUser.id,
              email: freshUser.email || '',
              username: freshUser.username,
              displayName: displayName,
              photoURL: photoURL,
              role: freshUser.role || 'user',
              level: freshUser.level || 1,
              xp: freshUser.xp || 0,
              provider: freshUser.provider || (freshUser.isSteamUser ? 'steam' : 'default'),
              steam_verified: freshUser.steamVerified || freshUser.steam_verified || false,
              account_status: freshUser.account_status || 'active',
              steamProfile: (freshUser.isSteamUser || freshUser.steamId) ? {
                avatar: photoURL,
                steamId: freshUser.steamId || '',
                profileUrl: freshUser.steamId ? `https://steamcommunity.com/profiles/${freshUser.steamId}` : ''
              } : undefined
            });
            
            setLoading(false);
            return;
          }
        } else {
          console.log('❌ API session validation failed:', response.status);
        }
      } catch (apiError) {
        console.error('❌ Failed to validate session via API:', apiError);
      }
      
      // No session at all - set loading to false first, then handle redirect
      setLoading(false);
      
      // Only redirect if on protected route and no session cookies exist
      const hasAnySessionCookie = equipggSessionCookie || mainSessionCookie;
      const isProtectedRoute = window.location.pathname.startsWith('/dashboard');
      const isAuthRoute = window.location.pathname.includes('/sign-in') || window.location.pathname.includes('/sign-up');
      
      if (!hasAnySessionCookie && isProtectedRoute && !isAuthRoute) {
        console.log('No valid session found, redirecting to sign-in');
        // Use replace to avoid back button issues
        window.location.replace(`/sign-in?redirect=${encodeURIComponent(window.location.pathname)}`);
      }
    }).catch((error) => {
      console.error('Error checking session:', error);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      console.log('Auth provider: Starting sign in...');
      setLoading(true);
      
      // Use the API route which sets the proper session cookie
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();
      console.log('Auth provider: Login API response:', { ok: response.ok, status: response.status });
      
      if (!response.ok) {
        setLoading(false);
        // Detect unconfirmed email error from backend
        if (data.error && typeof data.error === 'string' && data.error.toLowerCase().includes('confirm')) {
          throw new Error('Email not confirmed');
        }
        throw new Error(data.error || 'Login failed');
      }

      if (data.session && data.user) {
        console.log('Auth provider: Setting session and user...');
        console.log('Session data:', { 
          hasAccessToken: !!data.session.access_token,
          expiresAt: data.session.expires_at,
          userId: data.user.id,
          userRole: data.user.role 
        });
        
        // Skip the problematic setSession call for now - the cookie is already set by the API
        // const { error: sessionError } = await supabase.auth.setSession(data.session);
        // if (sessionError) {
        //   console.error('Failed to set Supabase session:', sessionError);
        //   throw sessionError;
        // }
        
        // Update local state immediately
        setSession(data.session);
        setUser({
          ...data.user,
          steam_verified: data.user.steam_verified || false,
          account_status: data.user.account_status || 'active'
        });
        setLoading(false);
        
        console.log('Auth provider: Sign in complete, user state updated');
        return data;
      } else {
        setLoading(false);
        throw new Error('No session returned from login');
      }
    } catch (error) {
      console.error('Auth provider sign in error:', error);
      setLoading(false);
      throw error;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    try {
      setLoading(true);
      
      // Use the API route for consistent session handling
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, displayName }),
        credentials: 'include',
      });

      const data = await response.json();
      console.log('Auth provider: Register API response:', { ok: response.ok, status: response.status });
      
      if (!response.ok) {
        setLoading(false);
        throw new Error(data.error || 'Registration failed');
      }

      // If registration was successful and returned a session, set it
      if (data.session && data.user) {
        console.log('Auth provider: Setting session and user after registration...');
        
        // Set the session in Supabase client
        await supabase.auth.setSession(data.session);
        
        // Update local state immediately
        setSession(data.session);
        setUser({
          ...data.user,
          steam_verified: data.user.steam_verified || false,
          account_status: data.user.account_status || 'active'
        });
        setLoading(false);
        
        console.log('Auth provider: Sign up complete');
        return data;
      } else if (data.emailVerificationRequired) {
        // Email verification required case
        setLoading(false);
        return data;
      } else {
        setLoading(false);
        throw new Error('Registration failed - no session returned');
      }
    } catch {
      console.error('Auth provider sign up error');
      setLoading(false);
      throw new Error('Sign up failed');
    }
  }, []);

  const signOutUser = useCallback(async () => {
    try {
      console.log('Starting logout process...');
      
      // Set a flag to prevent auto re-login
      sessionStorage.setItem('equipgg_logging_out', 'true');
      
      // Clear ALL cookies immediately
      document.cookie = 'equipgg_session=; Max-Age=0; path=/';
      document.cookie = 'equipgg_session_client=; Max-Age=0; path=/';
      document.cookie = 'equipgg_steam_session=; Max-Age=0; path=/';
      document.cookie = 'equipgg_steam_email=; Max-Age=0; path=/';
      document.cookie = 'equipgg_user_id=; Max-Age=0; path=/';
      document.cookie = 'equipgg_user_email=; Max-Age=0; path=/';
      
      // Clear local state immediately
      setUser(null);
      setSession(null);

      // Use the logout API route which clears the session cookie
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Logout API error:', errorData);
        throw new Error(errorData.error || 'Failed to logout from server');
      }

      console.log('Server logout successful');

      // Also sign out from Supabase client
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase logout error:', error);
        // Don't throw, still want to redirect
      }

      console.log('Supabase logout successful');

      toast({
        title: 'See you again!',
        description: 'You have been successfully logged out.',
      });

      // Force redirect to landing page
      console.log('Redirecting to home page...');
      
      // Wait a bit for the auth state listener to process
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    } catch {
      console.error('Sign out error');
      toast({
        title: 'Logout Error',
        description: 'There was an issue logging out. Please try again.',
        variant: 'destructive'
      });
    }
  }, [toast]);

  const refreshUser = useCallback(async () => {
    try {
      console.log('Refreshing user data...');
      
      // Check if we have a session first
      const cookies = document.cookie;
      const equipggMatch = cookies.match(/equipgg_session=([^;]+)/);
      
      if (equipggMatch) {
        try {
          const sessionData = JSON.parse(decodeURIComponent(equipggMatch[1]));
          
          // Fetch fresh user data from our API endpoint with cache busting
          const response = await fetch(`/api/me?t=${Date.now()}`, { 
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          
          if (response.ok) {
            const { user: freshUser } = await response.json();
            if (freshUser) {
              const displayName = freshUser.displayName || freshUser.displayname || freshUser.username || '';
              const photoURL = freshUser.avatarUrl || freshUser.photoURL || '';
              
              setUser({
                id: freshUser.id,
                email: freshUser.email || '',
                username: freshUser.username,
                displayName: displayName,
                equipped_banner: freshUser.equipped_banner || 'banner_default',
                photoURL: photoURL,
                role: freshUser.role || 'user',
                level: freshUser.level || 1,
                xp: freshUser.xp || 0,
                provider: freshUser.provider || (freshUser.isSteamUser ? 'steam' : 'default'),
                steam_verified: freshUser.steamVerified || freshUser.steam_verified || false,
                account_status: freshUser.account_status || 'active',
                steamProfile: (freshUser.isSteamUser || freshUser.steamId) ? {
                  avatar: photoURL,
                  steamId: freshUser.steamId || '',
                  profileUrl: freshUser.steamId ? `https://steamcommunity.com/profiles/${freshUser.steamId}` : ''
                } : undefined
              });
              
              console.log('User data refreshed successfully');
              return;
            }
          } else {
            console.warn('Failed to fetch fresh user data:', response.status);
          }
        } catch (parseError) {
          console.error('Failed to parse session cookie:', parseError);
        }
      }
      
      console.log('No valid session found during refresh');
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    enabled: true,
    signIn,
    signUp,
    signOutUser,
    refreshUser,
  }), [user, session, loading, signIn, signUp, signOutUser, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}


