import { createClient } from '@supabase/supabase-js';
import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

describe('Match Integration', () => {
  let authToken: string;

  beforeAll(async () => {
    // Sign in as admin to access all endpoints
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'testadmin123'
    });

    authToken = authData?.session?.access_token || '';
  });

  afterAll(async () => {
    await supabase.auth.signOut();
  });

  test('should fetch upcoming matches from PandaScore', async () => {
    const response = await fetch('http://localhost:3000/api/matches/upcoming', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.matches)).toBe(true);
    
    if (data.matches.length > 0) {
      const match = data.matches[0];
      expect(match).toHaveProperty('id');
      expect(match).toHaveProperty('scheduled_at');
      expect(match).toHaveProperty('tournament');
      expect(match).toHaveProperty('opponents');
    }
  });

  test('should fetch live matches from PandaScore', async () => {
    const response = await fetch('http://localhost:3000/api/matches/live', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.matches)).toBe(true);
    
    if (data.matches.length > 0) {
      const match = data.matches[0];
      expect(match).toHaveProperty('status');
      expect(match.status).toBe('running');
    }
  });

  test('should fetch match details from PandaScore', async () => {
    // First get a match ID
    const listResponse = await fetch('http://localhost:3000/api/matches/upcoming', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const listData = await listResponse.json();
    if (listData.matches.length > 0) {
      const matchId = listData.matches[0].id;

      const detailResponse = await fetch(`http://localhost:3000/api/matches/${matchId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(detailResponse.status).toBe(200);
      const detailData = await detailResponse.json();
      expect(detailData.match).toHaveProperty('id', matchId);
      expect(detailData.match).toHaveProperty('detailed_stats');
    }
  });

  test('should fetch match odds from HLTV scraper', async () => {
    // First get a match ID
    const listResponse = await fetch('http://localhost:3000/api/matches/upcoming', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const listData = await listResponse.json();
    if (listData.matches.length > 0) {
      const matchId = listData.matches[0].id;

      const oddsResponse = await fetch(`http://localhost:3000/api/matches/${matchId}/odds`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(oddsResponse.status).toBe(200);
      const oddsData = await oddsResponse.json();
      expect(oddsData).toHaveProperty('odds');
      expect(oddsData.odds).toHaveProperty('team1');
      expect(oddsData.odds).toHaveProperty('team2');
      expect(typeof oddsData.odds.team1).toBe('number');
      expect(typeof oddsData.odds.team2).toBe('number');
    }
  });

  test('should handle match updates from PandaScore webhook', async () => {
    const webhookResponse = await fetch('http://localhost:3000/api/webhooks/pandascore', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: 'match_updated',
        data: {
          id: 123,
          status: 'finished',
          winner: { id: 456, name: 'Test Team' },
          score: { team1: 16, team2: 14 }
        }
      })
    });

    expect(webhookResponse.status).toBe(200);
    const webhookData = await webhookResponse.json();
    expect(webhookData.success).toBe(true);
  });

  test('should cache match data properly', async () => {
    // Make two rapid requests for the same data
    const response1 = await fetch('http://localhost:3000/api/matches/upcoming', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const response2 = await fetch('http://localhost:3000/api/matches/upcoming', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);

    // Check cache headers
    expect(response2.headers.get('x-cache')).toBe('HIT');
  });

  test('should handle PandaScore API rate limits', async () => {
    // Make multiple rapid requests to trigger rate limiting
    const requests = Array(10).fill(null).map(() => 
      fetch('http://localhost:3000/api/matches/upcoming', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })
    );

    const responses = await Promise.all(requests);
    
    // Some requests should still succeed due to caching
    const successfulResponses = responses.filter(r => r.status === 200);
    expect(successfulResponses.length).toBeGreaterThan(0);

    // Some requests might be rate limited
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    if (rateLimitedResponses.length > 0) {
      const rateLimitedData = await rateLimitedResponses[0].json();
      expect(rateLimitedData).toHaveProperty('error');
      expect(rateLimitedData.error).toMatch(/rate limit/i);
    }
  });
});