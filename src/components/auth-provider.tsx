'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from "../lib/supabase";
import { useToast } from "../hooks/use-toast";
import type { Session, User } from '@supabase/supabase-js';

interface ApiUser {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  role?: string;
  provider?: 'steam' | 'default';
  steamProfile?: {
    steamId?: string;
    avatar?: string;
    profileUrl?: string;
  };
}

export type LocalUser = {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: string;
  level?: number;
  xp?: number;
  provider?: 'steam' | 'default';
  steam_verified?: boolean;
  account_status?: string;
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
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, displayName?: string) => Promise<any>;
  signOutUser: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  enabled: true,
  async signIn() {},
  async signUp() {},
  async signOutUser() {},
  async refreshUser() {},
});

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    ...init,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error || res.statusText);
  }
  return res.json();
}

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

    const checkMainSessionCookie = async () => {
    try {
      console.log('Checking main session cookie via API call');
      const response = await fetch('/api/me', {
        method: 'GET',
        credentials: 'include', // Important: include cookies
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('Main session cookie is valid, user data:', userData);
        
        // Set user directly without going through loadSteamUser
        setUser({
          id: userData.user_id || userData.id,
          email: userData.email,
          displayName: userData.displayName || userData.displayname,
          photoURL: userData.avatarUrl || userData.avatar_url,
          role: userData.role,
          provider: 'steam',
          steamProfile: userData.steamProfile
        });
        setLoading(false);
      } else {
        console.log('Main session cookie check failed:', response.status);
        setLoading(false);
      }
    } catch (error) {
      console.log('Error checking main session cookie:', error);
      setLoading(false);
    }
  };

  const loadSteamUser = async (userId: string, email: string) => {
    try {
      console.log('Loading Steam user:', userId);
      
      // Get user data from our database
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error || !userData) {
        console.error('Failed to load Steam user:', error);
        return;
      }

      // Create a mock session for Steam users
      const mockSession = {
        access_token: `steam-${userId}`,
        refresh_token: `steam-refresh-${userId}`,
        expires_in: 60 * 60 * 24 * 7,
        expires_at: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7),
        token_type: 'bearer',
        user: {
          id: userId,
          email: email,
          email_confirmed_at: new Date().toISOString(),
          app_metadata: { provider: 'steam' },
          user_metadata: { 
            displayName: userData.displayname,
            provider: 'steam'
          }
        }
      } as any;

      const localUser: LocalUser = {
        id: userData.id,
        email: userData.email,
        displayName: userData.displayname,
        photoURL: userData.avatar_url,
        role: userData.role,
        level: userData.level,
        xp: userData.xp,
        provider: 'steam',
        steam_verified: userData.steam_verified || true,
        account_status: userData.account_status || 'active'
      };

      setSession(mockSession);
      setUser(localUser);
      setLoading(false);
      
      console.log('Steam user loaded successfully');
    } catch (error) {
      console.error('Error loading Steam user:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setLoading(true);

      // DEVELOPMENT OVERRIDE: If localhost and we have any Steam-related cookies, just log in
      if (process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost') {
        const steamUserId = getCookie('equipgg_user_id');
        const steamUserEmail = getCookie('equipgg_user_email');
        
        if (steamUserId && steamUserEmail) {
          console.log('DEVELOPMENT MODE: Auto-login with Steam cookies');
          setUser({
            id: steamUserId,
            email: decodeURIComponent(steamUserEmail),
            displayName: steamUserId.replace('steam-', ''),
            photoURL: null,
            role: 'user',
            provider: 'steam',
            steamProfile: {
              steamId: steamUserId.replace('steam-', ''),
              avatar: null,
              profileUrl: null
            }
          });
          setLoading(false);
          return;
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
          displayName: profile?.displayname || session.user.user_metadata?.displayName,
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
    supabase.auth.getSession().then(({ data: { session } }) => {
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
          let cookieValue = equipggSessionCookie;
          let sessionData = null;
          
          try {
            // Try single decode first
            sessionData = JSON.parse(decodeURIComponent(cookieValue));
          } catch (firstError) {
            console.log('Single decode failed, trying double decode');
            // If single decode fails, try double decode
            sessionData = JSON.parse(decodeURIComponent(decodeURIComponent(cookieValue)));
          }
          
          console.log('Found equipgg_session_client cookie:', sessionData);
          
          // Check if session is still valid
          if (sessionData.expires_at && Date.now() < sessionData.expires_at) {
            console.log('Session is valid, loading user data');
            loadSteamUser(sessionData.user_id, sessionData.email);
            return;
          } else {
            console.log('Session expired, clearing cookie');
            document.cookie = 'equipgg_session_client=; Max-Age=0; path=/';
            document.cookie = 'equipgg_session=; Max-Age=0; path=/';
          }
        } catch (parseError) {
          console.log('Failed to parse equipgg_session_client cookie:', parseError);
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
            console.log('Main session is valid, loading user data');
            
            // For localhost development, bypass the full loadSteamUser and set user directly
            if (process.env.NODE_ENV === 'development' && sessionData.user_id && sessionData.email) {
              console.log('Development mode: Setting user directly from session');
              setUser({
                id: sessionData.user_id,
                email: sessionData.email,
                displayName: sessionData.user_id.replace('steam-', ''), // Extract Steam ID
                photoURL: null,
                role: sessionData.role || 'user',
                provider: 'steam',
                steamProfile: {
                  steamId: sessionData.user_id.replace('steam-', ''),
                  avatar: null,
                  profileUrl: null
                }
              });
              setLoading(false);
              return;
            }
            
            loadSteamUser(sessionData.user_id, sessionData.email);
            return;
          } else {
            console.log('Main session expired');
          }
        } catch (parseError) {
          console.log('Failed to parse main session cookie, falling back to API call:', parseError);
          
          // Fallback to API validation if direct parsing fails
          setLoading(true);
          
          fetch('/api/me', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Accept': 'application/json' },
          })
          .then(response => {
            if (response.ok) {
              return response.json();
            }
            throw new Error('Session validation failed');
          })
          .then(userData => {
            console.log('Main session cookie is valid, user data:', userData);
            setUser({
              id: userData.user_id || userData.id,
              email: userData.email,
              displayName: userData.displayName || userData.displayname,
              photoURL: userData.avatarUrl || userData.avatar_url,
              role: userData.role,
              provider: 'steam',
              steamProfile: userData.steamProfile
            });
            setLoading(false);
          })
          .catch(error => {
            console.log('Session validation failed:', error);
            setLoading(false);
            
            // Only redirect after the API call fails
            if (window.location.pathname.startsWith('/dashboard') && !window.location.pathname.includes('/sign-in')) {
              console.log('No valid session found after API check, redirecting to sign-in');
              window.location.href = `/sign-in?redirect=${encodeURIComponent(window.location.pathname)}`;
            }
          });
        }
        
        return;
      }
      
      // If no new session format, check for legacy Steam session
      const steamSession = getCookie('equipgg_steam_session');
      const steamEmail = getCookie('equipgg_steam_email');
      
      if (steamSession && steamEmail) {
        console.log('Found legacy Steam session, loading user data');
        // Load user data from the database using the Steam session
        loadSteamUser(steamSession, steamEmail);
        return;
      }
      
      // No session at all - set loading to false first, then redirect
      setLoading(false);
      
      // Only redirect if on protected route, not already on sign-in, AND no session cookies exist
      const hasAnySessionCookie = equipggSessionCookie || mainSessionCookie;
      if (!hasAnySessionCookie && window.location.pathname.startsWith('/dashboard') && !window.location.pathname.includes('/sign-in')) {
        console.log('No valid session found, redirecting to sign-in');
        window.location.href = `/sign-in?redirect=${encodeURIComponent(window.location.pathname)}`;
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
      });

      const data = await response.json();
      console.log('Auth provider: Login API response:', { ok: response.ok, status: response.status });
      
      if (!response.ok) {
        setLoading(false);
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
    } catch (error) {
      console.error('Auth provider sign up error:', error);
      setLoading(false);
      throw error;
    }
  }, []);

  const signOutUser = useCallback(async () => {
    try {
      console.log('Starting logout process...');
      
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
        throw error;
      }

      console.log('Supabase logout successful');

      toast({
        title: 'See you again!',
        description: 'You have been successfully logged out.',
      });

      // Clear local state
      setUser(null);
      setSession(null);

      // Clear Steam cookies client-side as well (backup)
      document.cookie = 'equipgg_steam_session=; Max-Age=0; path=/';
      document.cookie = 'equipgg_steam_email=; Max-Age=0; path=/';

      // Force redirect to landing page
      console.log('Redirecting to home page...');
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
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
      
      // For now, let's use our custom session approach
      const cookies = document.cookie;
      const equipggMatch = cookies.match(/equipgg_session=([^;]+)/);
      
      if (equipggMatch) {
        try {
          const sessionData = JSON.parse(decodeURIComponent(equipggMatch[1]));
          // Fetch fresh user data from database
          const response = await fetch('/api/me', { credentials: 'include' });
          if (response.ok) {
            const { user: freshUser } = await response.json();
            if (freshUser) {
              setUser({
                id: freshUser.id,
                email: freshUser.email || '',
                displayName: freshUser.displayName || '',
                photoURL: freshUser.avatarUrl || '',
                role: freshUser.role || 'user',
                level: freshUser.level || 1,
                xp: freshUser.xp || 0,
                provider: 'default',
                steam_verified: freshUser.steam_verified || false,
                account_status: freshUser.account_status || 'active'
              });
              console.log('User data refreshed successfully');
              return;
            }
          }
        } catch (parseError) {
          console.log('Failed to parse session cookie');
        }
      }
      
      // Fallback to Supabase approach
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        setUser({
          id: user.id,
          email: user.email || '',
          displayName: profile?.displayname || user.user_metadata?.displayName,
          photoURL: profile?.avatar_url || user.user_metadata?.avatar,
          role: profile?.role || 'user',
          level: profile?.level || 1,
          xp: profile?.xp || 0,
          provider: (user.app_metadata?.provider as 'steam' | 'default') || 'default',
          steam_verified: profile?.steam_verified || false,
          account_status: profile?.account_status || 'active',
          steamProfile: user.user_metadata?.steamProfile
        });
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
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


