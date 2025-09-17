'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

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
  uid: string;
  id: string; // Add id field for compatibility
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: string;
  level?: number;
  xp?: number; // Add xp field
  provider?: 'steam' | 'default';
  steamProfile?: {
    steamId?: string;
    avatar?: string;
    profileUrl?: string;
  };
};

type AuthContextValue = {
  user: LocalUser | null;
  loading: boolean;
  enabled: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/api/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser({
              uid: data.user.id,
              email: data.user.email,
              displayName: data.user.displayName,
              photoURL: data.user.avatarUrl,
              role: data.user.role,
              provider: data.user.provider || 'default',
              steamProfile: data.user.steamProfile,
            });
          }
        } else {
          throw new Error('Failed to fetch user data');
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        // Clear invalid session cookies and redirect to signin
        document.cookie = 'equipgg_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // If we're on a protected route, redirect to signin
        if (window.location.pathname.startsWith('/dashboard')) {
          window.location.href = `/signin?redirect=${encodeURIComponent(window.location.pathname)}`;
          return;
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in with:', email);
      
      // Use fetch directly to have more control over the request
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      
      if (!loginResponse.ok) {
        const errorData = await loginResponse.json().catch(() => ({}));
        throw new Error(errorData?.error || 'Login failed');
      }
      
      const loginData = await loginResponse.json();
      console.log('Login response:', loginData);
      
      if (loginData.user) {
        const newUser = { 
          uid: loginData.user.id, 
          email: loginData.user.email, 
          displayName: loginData.user.displayName, 
          photoURL: loginData.user.avatarUrl, 
          role: loginData.user.role,
          provider: 'default',
          steamProfile: undefined
        };
        console.log('Setting user from login response:', newUser);
        setUser(newUser);
        // Force a longer delay to ensure session cookie is properly set
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.error('No user data received from login response');
        throw new Error('Authentication failed - no user data received');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    try {
      await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, displayName }) });
      await signIn(email, password);
      await api('/api/events/login', { method: 'POST' });
      // Award signup bonus
      await api('/api/xp/award', { method: 'POST', body: JSON.stringify({ 
        activity_type: 'daily_bonus',
        reason: 'Welcome bonus for new user'
      }) });
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }, [signIn]);

  const signOutUser = useCallback(async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      // Show goodbye message and redirect
      const { toast } = await import('@/hooks/use-toast');
      toast({
        title: 'See you again!',
        description: 'You have been successfully logged out.',
      });
      // Redirect to landing page
      window.location.replace('/');
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch('/api/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser({
            uid: data.user.id,
            email: data.user.email,
            displayName: data.user.displayName,
            photoURL: data.user.avatarUrl,
            role: data.user.role,
            provider: data.user.provider || 'default',
            steamProfile: data.user.steamProfile,
          });
        }
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  const value: AuthContextValue = useMemo(() => ({
    user,
    loading,
    enabled: true,
    signIn,
    signUp,
    signOutUser,
    refreshUser,
  }), [user, loading, signIn, signUp, signOutUser, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}


