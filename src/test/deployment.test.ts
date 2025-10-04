import { createClient } from '@supabase/supabase-js';
import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

describe('Deployment Verification', () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    // Sign in as admin and regular user
    const adminAuth = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'testadmin123'
    });

    const userAuth = await supabase.auth.signInWithPassword({
      email: 'user@test.com',
      password: 'testuser123'
    });

    adminToken = adminAuth.data?.session?.access_token || '';
    userToken = userAuth.data?.session?.access_token || '';
  });

  afterAll(async () => {
    await supabase.auth.signOut();
  });

  test('should verify database connection and migrations', async () => {
    const tables = ['users', 'items', 'user_inventory', 'missions', 'user_bets'];
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1);

      expect(error).toBeNull();
    }
  });

  test('should verify Steam integration', async () => {
    const response = await fetch('http://localhost:3000/api/auth/steam/status', {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.enabled).toBe(true);
  });

  test('should verify PandaScore API connection', async () => {
    const response = await fetch('http://localhost:3000/api/matches/status', {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('operational');
  });

  test('should verify required environment variables', async () => {
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'STEAM_API_KEY',
      'PANDASCORE_API_KEY',
      'NEXT_PUBLIC_SITE_URL'
    ];

    requiredVars.forEach(varName => {
      expect(process.env[varName]).toBeDefined();
    });
  });

  test('should verify critical system components', async () => {
    const components = [
      { endpoint: '/api/health', name: 'API Health' },
      { endpoint: '/api/auth/session', name: 'Authentication' },
      { endpoint: '/api/inventory/status', name: 'Inventory System' },
      { endpoint: '/api/matches/status', name: 'Match System' },
      { endpoint: '/api/missions/status', name: 'Mission System' }
    ];

    for (const component of components) {
      const response = await fetch(`http://localhost:3000${component.endpoint}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('operational');
    }
  });

  test('should verify cache configuration', async () => {
    const response = await fetch('http://localhost:3000/api/matches/upcoming', {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.headers.get('cache-control')).toBeTruthy();
  });

  test('should verify rate limiting', async () => {
    const requests = Array(20).fill(null).map(() => 
      fetch('http://localhost:3000/api/matches/upcoming', {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      })
    );

    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r.status === 429);
    expect(rateLimited).toBe(true);
  });

  test('should verify error handling', async () => {
    const response = await fetch('http://localhost:3000/api/invalid-endpoint', {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  test('should verify maintenance mode functionality', async () => {
    // Enable maintenance mode
    await fetch('http://localhost:3000/api/admin/settings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        maintenance_mode: true,
        maintenance_message: 'Test maintenance'
      })
    });

    // Verify normal users are blocked
    const userResponse = await fetch('http://localhost:3000/api/matches/upcoming', {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(userResponse.status).toBe(503);

    // Verify admin can still access
    const adminResponse = await fetch('http://localhost:3000/api/matches/upcoming', {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(adminResponse.status).toBe(200);

    // Disable maintenance mode
    await fetch('http://localhost:3000/api/admin/settings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        maintenance_mode: false
      })
    });
  });
});