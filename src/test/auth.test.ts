import { createClient } from '@supabase/supabase-js';
import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

describe('Authentication System', () => {
  // Test users with different roles
  const testUsers = {
    admin: {
      email: 'admin@test.com',
      password: 'testadmin123',
      role: 'admin'
    },
    moderator: {
      email: 'mod@test.com',
      password: 'testmod123',
      role: 'moderator'
    },
    user: {
      email: 'user@test.com',
      password: 'testuser123',
      role: 'user'
    }
  };

  const authTokens: Record<string, string> = {};

  beforeAll(async () => {
    // Sign in all test users and store their tokens
    for (const [role, userData] of Object.entries(testUsers)) {
      const { data: authData } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password
      });

      if (authData?.session?.access_token) {
        authTokens[role] = authData.session.access_token;
      }
    }
  });

  afterAll(async () => {
    // Sign out all users
    await supabase.auth.signOut();
  });

  test('should authenticate admin user with correct permissions', async () => {
    const response = await fetch('http://localhost:3000/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${authTokens.admin}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.users).toBeDefined();
  });

  test('should deny admin access to non-admin users', async () => {
    const response = await fetch('http://localhost:3000/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${authTokens.user}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(403);
  });

  test('should authenticate moderator with correct permissions', async () => {
    const response = await fetch('http://localhost:3000/api/moderator/reports', {
      headers: {
        'Authorization': `Bearer ${authTokens.moderator}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.reports).toBeDefined();
  });

  test('should handle Steam authentication callback', async () => {
    const response = await fetch('http://localhost:3000/api/auth/steam/callback', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(302); // Should redirect
    const location = response.headers.get('location');
    expect(location).toBeTruthy();
    expect(location?.startsWith('http')).toBe(true);
  });

  test('should update user profile with Steam data', async () => {
    // Mock Steam profile data
    const steamProfile = {
      steamid: '76561198000000000',
      personaname: 'TestUser',
      avatarfull: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/test.jpg',
      profileurl: 'https://steamcommunity.com/id/testuser'
    };

    const response = await fetch('http://localhost:3000/api/auth/steam/update-profile', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authTokens.user}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(steamProfile)
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.profile.steam_id).toBe(steamProfile.steamid);
    expect(data.profile.avatar_url).toBe(steamProfile.avatarfull);
  });

  test('should maintain session state', async () => {
    // Test session persistence
    const response = await fetch('http://localhost:3000/api/auth/session', {
      headers: {
        'Authorization': `Bearer ${authTokens.user}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.session).toBeDefined();
    expect(data.session.user.email).toBe(testUsers.user.email);
  });

  test('should handle role-based access control', async () => {
    // Test admin endpoint with different roles
    const endpoints = {
      admin: '/api/admin/system',
      moderator: '/api/moderator/chat',
      user: '/api/user/profile'
    };

    for (const [role, token] of Object.entries(authTokens)) {
      for (const [endpointRole, endpoint] of Object.entries(endpoints)) {
        const response = await fetch(`http://localhost:3000${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (role === endpointRole || role === 'admin' || (role === 'moderator' && endpointRole === 'user')) {
          expect(response.status).toBe(200);
        } else {
          expect(response.status).toBe(403);
        }
      }
    }
  });
});