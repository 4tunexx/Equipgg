import { createClient } from '@supabase/supabase-js';
import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

describe('Mission System', () => {
  let userToken: string;
  let testMissionId: string;

  beforeAll(async () => {
    // Sign in test user
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'user@test.com',
      password: 'testuser123'
    });

    userToken = authData?.session?.access_token || '';

    // Create test mission
    const { data: missionData } = await supabase
      .from('missions')
      .insert({
        title: 'Test Mission',
        description: 'Test mission description',
        type: 'DAILY',
        requirement_type: 'MATCHES_PLAYED',
        requirement_value: 3,
        reward_type: 'COINS',
        reward_amount: 100
      })
      .select()
      .single();

    testMissionId = missionData?.id;
  });

  afterAll(async () => {
    // Clean up test data
    await supabase
      .from('missions')
      .delete()
      .eq('id', testMissionId);

    await supabase.auth.signOut();
  });

  test('should fetch daily missions', async () => {
    const response = await fetch('http://localhost:3000/api/missions/daily', {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.missions)).toBe(true);
    
    if (data.missions.length > 0) {
      const mission = data.missions[0];
      expect(mission).toHaveProperty('title');
      expect(mission).toHaveProperty('description');
      expect(mission).toHaveProperty('progress');
      expect(mission).toHaveProperty('completed');
    }
  });

  test('should track mission progress', async () => {
    // Simulate match completion to progress mission
    const progressResponse = await fetch('http://localhost:3000/api/missions/progress', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'MATCHES_PLAYED',
        amount: 1
      })
    });

    expect(progressResponse.status).toBe(200);
    const progressData = await progressResponse.json();
    expect(progressData.success).toBe(true);

    // Check updated progress
    const missionResponse = await fetch(`http://localhost:3000/api/missions/${testMissionId}`, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(missionResponse.status).toBe(200);
    const missionData = await missionResponse.json();
    expect(missionData.mission.progress).toBeGreaterThan(0);
  });

  test('should claim completed mission rewards', async () => {
    // Complete the mission
    await fetch('http://localhost:3000/api/missions/progress', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'MATCHES_PLAYED',
        amount: 3
      })
    });

    // Claim reward
    const claimResponse = await fetch(`http://localhost:3000/api/missions/${testMissionId}/claim`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(claimResponse.status).toBe(200);
    const claimData = await claimResponse.json();
    expect(claimData.success).toBe(true);
    expect(claimData.reward).toBeDefined();
    expect(claimData.reward.amount).toBe(100);

    // Verify mission is marked as claimed
    const verifyResponse = await fetch(`http://localhost:3000/api/missions/${testMissionId}`, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(verifyResponse.status).toBe(200);
    const verifyData = await verifyResponse.json();
    expect(verifyData.mission.claimed).toBe(true);
  });

  test('should reset daily missions at appropriate time', async () => {
    // Get current missions
    const before = await fetch('http://localhost:3000/api/missions/daily', {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });

    const beforeData = await before.json();

    // Trigger daily reset
    const resetResponse = await fetch('http://localhost:3000/api/missions/reset', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(resetResponse.status).toBe(200);

    // Get new missions
    const after = await fetch('http://localhost:3000/api/missions/daily', {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });

    const afterData = await after.json();

    // Verify missions have been reset
    expect(afterData.missions).not.toEqual(beforeData.missions);
    afterData.missions.forEach((mission: { progress: number; completed: boolean; claimed: boolean }) => {
      expect(mission.progress).toBe(0);
      expect(mission.completed).toBe(false);
      expect(mission.claimed).toBe(false);
    });
  });

  test('should handle mission streak bonuses', async () => {
    // Complete daily missions for consecutive days
    const streakResponse = await fetch('http://localhost:3000/api/missions/streak', {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(streakResponse.status).toBe(200);
    const streakData = await streakResponse.json();
    expect(streakData).toHaveProperty('current_streak');
    expect(streakData).toHaveProperty('highest_streak');
    expect(streakData).toHaveProperty('streak_bonus');

    if (streakData.current_streak > 1) {
      expect(streakData.streak_bonus).toBeGreaterThan(0);
    }
  });

  test('should track mission statistics', async () => {
    const statsResponse = await fetch('http://localhost:3000/api/missions/stats', {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(statsResponse.status).toBe(200);
    const statsData = await statsResponse.json();
    expect(statsData.stats).toBeDefined();
    expect(statsData.stats).toHaveProperty('total_completed');
    expect(statsData.stats).toHaveProperty('total_rewards');
    expect(statsData.stats).toHaveProperty('current_streak');
  });
});