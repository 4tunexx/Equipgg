import { createClient } from '@supabase/supabase-js';
import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

describe('User Profile System', () => {
  let testUser: { id: string; level: number } | null;
  let authToken: string;

  beforeAll(async () => {
    // Sign in test user
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'user@test.com',
      password: 'testuser123'
    });

    authToken = authData?.session?.access_token || '';

    // Get test user data
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'user@test.com')
      .single();

    testUser = userData;
  });

  afterAll(async () => {
    await supabase.auth.signOut();
  });

  test('should display correct user ranks', async () => {
    const response = await fetch(`http://localhost:3000/api/user/${testUser.id}/ranks`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ranks).toBeDefined();
    expect(Array.isArray(data.ranks)).toBe(true);
    expect(data.ranks[0]).toHaveProperty('rank_name');
    expect(data.ranks[0]).toHaveProperty('rank_image');
  });

  test('should show user badges', async () => {
    const response = await fetch(`http://localhost:3000/api/user/${testUser.id}/badges`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.badges).toBeDefined();
    expect(Array.isArray(data.badges)).toBe(true);
    data.badges.forEach((badge: { name: string; image_url: string; description: string }) => {
      expect(badge).toHaveProperty('name');
      expect(badge).toHaveProperty('image_url');
      expect(badge).toHaveProperty('description');
    });
  });

  test('should render mini profile card correctly', async () => {
    const response = await fetch(`http://localhost:3000/api/user/${testUser.id}/mini-profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.profile).toBeDefined();
    expect(data.profile).toHaveProperty('username');
    expect(data.profile).toHaveProperty('avatar_url');
    expect(data.profile).toHaveProperty('level');
    expect(data.profile).toHaveProperty('rank');
  });

  test('should display hover card with extended info', async () => {
    const response = await fetch(`http://localhost:3000/api/user/${testUser.id}/hover-card`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.hoverCard).toBeDefined();
    expect(data.hoverCard).toHaveProperty('stats');
    expect(data.hoverCard.stats).toHaveProperty('matches_played');
    expect(data.hoverCard.stats).toHaveProperty('win_rate');
    expect(data.hoverCard).toHaveProperty('recent_achievements');
  });

  test('should update Steam avatar across all components', async () => {
    const newAvatarUrl = 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/new.jpg';
    
    // Update avatar
    const updateResponse = await fetch('http://localhost:3000/api/user/update-avatar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ avatar_url: newAvatarUrl })
    });

    expect(updateResponse.status).toBe(200);

    // Check mini profile
    const miniProfileResponse = await fetch(`http://localhost:3000/api/user/${testUser.id}/mini-profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const miniProfileData = await miniProfileResponse.json();
    expect(miniProfileData.profile.avatar_url).toBe(newAvatarUrl);

    // Check hover card
    const hoverCardResponse = await fetch(`http://localhost:3000/api/user/${testUser.id}/hover-card`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const hoverCardData = await hoverCardResponse.json();
    expect(hoverCardData.hoverCard.avatar_url).toBe(newAvatarUrl);

    // Check main profile
    const profileResponse = await fetch(`http://localhost:3000/api/user/${testUser.id}/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const profileData = await profileResponse.json();
    expect(profileData.profile.avatar_url).toBe(newAvatarUrl);
  });

  test('should update and display user level correctly', async () => {
    // Add XP to trigger level up
    const xpResponse = await fetch('http://localhost:3000/api/user/add-xp', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ xp: 1000 }) // Assuming 1000 XP triggers level up
    });

    expect(xpResponse.status).toBe(200);
    const xpData = await xpResponse.json();
    expect(xpData.levelUp).toBe(true);

    // Verify level up is reflected in profile
    const profileResponse = await fetch(`http://localhost:3000/api/user/${testUser.id}/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const profileData = await profileResponse.json();
    expect(profileData.profile.level).toBeGreaterThan(testUser.level);
  });
});