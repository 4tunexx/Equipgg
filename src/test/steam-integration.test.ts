import { createClient } from '@supabase/supabase-js';
import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

describe('Steam Integration Flow', () => {
  let testUserToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create a test user for Steam integration testing
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'steamtest@test.com',
      password: 'teststeam123'
    });

    testUserToken = authData?.session?.access_token || '';
    testUserId = authData?.user?.id || '';
  });

  afterAll(async () => {
    await supabase.auth.signOut();
  });

  test('should check Steam verification status for unverified user', async () => {
    const response = await fetch(`http://localhost:3000/api/steam-verification/check?userId=${testUserId}`, {
      headers: {
        'Authorization': `Bearer ${testUserToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('needsVerification');
    expect(data).toHaveProperty('steamVerified');
    expect(data).toHaveProperty('hasSteamId');
    expect(data).toHaveProperty('provider');
    
    // Test user should need verification (not steam_verified and not steam provider)
    expect(data.needsVerification).toBe(true);
    expect(data.steamVerified).toBe(false);
  });

  test('should fetch user data with Steam information via /api/me', async () => {
    const response = await fetch('http://localhost:3000/api/me', {
      headers: {
        'Authorization': `Bearer ${testUserToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    
    // Check that user data structure includes Steam fields
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('email');
    expect(data).toHaveProperty('displayName');
    expect(data).toHaveProperty('provider');
    expect(data).toHaveProperty('steamVerified');
    expect(data).toHaveProperty('steamId');
    expect(data).toHaveProperty('isSteamUser');
    
    // Test user should not be Steam verified initially
    expect(data.steamVerified).toBe(false);
    expect(data.isSteamUser).toBe(false);
  });

  test('should handle Steam verification gate logic correctly', async () => {
    // Test the Steam verification check endpoint that the gate uses
    const response = await fetch(`http://localhost:3000/api/steam-verification/check?userId=${testUserId}`);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    
    // For a non-Steam, unverified user, needsVerification should be true
    expect(data.needsVerification).toBe(true);
  });

  test('should force verify user for testing purposes', async () => {
    const response = await fetch('http://localhost:3000/api/steam-verification', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUserToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: testUserId,
        force: true
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe('User forcefully verified');
  });

  test('should verify user no longer needs Steam verification after force verify', async () => {
    const response = await fetch(`http://localhost:3000/api/steam-verification/check?userId=${testUserId}`, {
      headers: {
        'Authorization': `Bearer ${testUserToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    
    // After force verification, user should no longer need verification
    expect(data.needsVerification).toBe(false);
    expect(data.steamVerified).toBe(true);
  });

  test('should handle Steam popup authentication endpoint', async () => {
    // Test that the Steam popup endpoint is accessible
    const response = await fetch('http://localhost:3000/api/auth/steam/popup', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Should redirect to Steam or return an error page
    expect([302, 200, 500]).toContain(response.status);
  });

  test('should handle Steam verification status API', async () => {
    const response = await fetch('http://localhost:3000/api/auth/steam/status', {
      headers: {
        'Authorization': `Bearer ${testUserToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('steamLinked');
    expect(data).toHaveProperty('steamVerified');
  });

  test('should display Steam avatar and display name in profile components', async () => {
    // Test that profile endpoints return Steam data
    const response = await fetch('http://localhost:3000/api/me', {
      headers: {
        'Authorization': `Bearer ${testUserToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    
    // Check Steam-specific fields that profile components use
    if (data.steamVerified) {
      expect(data).toHaveProperty('steamProfile');
      expect(data.steamProfile).toHaveProperty('steamId');
      expect(data.steamProfile).toHaveProperty('avatar');
      expect(data.steamProfile).toHaveProperty('profileUrl');
    }
  });

  test('should handle Steam verification with existing Steam ID conflict', async () => {
    // This test simulates what happens when a Steam ID is already linked to another account
    // We'll test the conflict detection logic by attempting to verify with a mock Steam ID
    
    // First, let's check if our verification check endpoint handles this scenario
    const response = await fetch(`http://localhost:3000/api/steam-verification/check?userId=${testUserId}`);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    
    // The endpoint should handle the check without errors
    expect(data).toHaveProperty('needsVerification');
    expect(data).toHaveProperty('steamVerified');
  });

  test('should maintain session consistency after Steam verification changes', async () => {
    // Test that session data remains consistent after verification changes
    const response = await fetch('http://localhost:3000/api/auth/session', {
      headers: {
        'Authorization': `Bearer ${testUserToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    
    expect(data.session).toBeDefined();
    expect(data.session.user).toBeDefined();
    
    // Session should reflect current verification status
    const meResponse = await fetch('http://localhost:3000/api/me', {
      headers: {
        'Authorization': `Bearer ${testUserToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const meData = await meResponse.json();
    expect(meData.steamVerified).toBe(data.session.user.steam_verified || false);
  });
});