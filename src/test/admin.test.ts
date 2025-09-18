import { createClient } from '@supabase/supabase-js';
import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

describe('Admin Functions', () => {
  let adminToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Sign in as admin
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'testadmin123'
    });

    adminToken = authData?.session?.access_token || '';

    // Create a test user for admin operations
    const { data: userData } = await supabase.auth.signUp({
      email: 'admintest@test.com',
      password: 'test123'
    });

    testUserId = userData?.user?.id || '';
  });

  afterAll(async () => {
    // Clean up test user
    await supabase
      .from('users')
      .delete()
      .eq('id', testUserId);

    await supabase.auth.signOut();
  });

  test('should manage user accounts', async () => {
    // Get all users
    const listResponse = await fetch('http://localhost:3000/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(listResponse.status).toBe(200);
    const listData = await listResponse.json();
    expect(Array.isArray(listData.users)).toBe(true);

    // Ban user
    const banResponse = await fetch('http://localhost:3000/api/admin/users/ban', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: testUserId,
        reason: 'Test ban'
      })
    });

    expect(banResponse.status).toBe(200);
    const banData = await banResponse.json();
    expect(banData.success).toBe(true);

    // Verify user is banned
    const userResponse = await fetch(`http://localhost:3000/api/admin/users/${testUserId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    const userData = await userResponse.json();
    expect(userData.user.banned).toBe(true);

    // Unban user
    const unbanResponse = await fetch('http://localhost:3000/api/admin/users/unban', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: testUserId
      })
    });

    expect(unbanResponse.status).toBe(200);
    const unbanData = await unbanResponse.json();
    expect(unbanData.success).toBe(true);
  });

  test('should manage system settings', async () => {
    // Update system settings
    const updateResponse = await fetch('http://localhost:3000/api/admin/settings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        maintenance_mode: true,
        maintenance_message: 'System under maintenance'
      })
    });

    expect(updateResponse.status).toBe(200);
    const updateData = await updateResponse.json();
    expect(updateData.success).toBe(true);

    // Get system settings
    const getResponse = await fetch('http://localhost:3000/api/admin/settings', {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(getResponse.status).toBe(200);
    const getData = await getResponse.json();
    expect(getData.settings.maintenance_mode).toBe(true);
    expect(getData.settings.maintenance_message).toBe('System under maintenance');

    // Reset maintenance mode
    await fetch('http://localhost:3000/api/admin/settings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        maintenance_mode: false,
        maintenance_message: ''
      })
    });
  });

  test('should manage item database', async () => {
    // Add test item
    const addItemResponse = await fetch('http://localhost:3000/api/admin/items', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Item',
        type: 'Knife',
        rarity: 'Covert',
        value: 1000
      })
    });

    expect(addItemResponse.status).toBe(200);
    const itemData = await addItemResponse.json();
    expect(itemData.item.name).toBe('Test Item');

    // Update item
    const updateItemResponse = await fetch(`http://localhost:3000/api/admin/items/${itemData.item.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        value: 1500
      })
    });

    expect(updateItemResponse.status).toBe(200);
    const updatedData = await updateItemResponse.json();
    expect(updatedData.item.value).toBe(1500);

    // Delete item
    const deleteItemResponse = await fetch(`http://localhost:3000/api/admin/items/${itemData.item.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(deleteItemResponse.status).toBe(200);
  });

  test('should manage transactions and balance', async () => {
    // Add balance to user
    const addBalanceResponse = await fetch('http://localhost:3000/api/admin/users/balance', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: testUserId,
        amount: 1000,
        reason: 'Test balance addition'
      })
    });

    expect(addBalanceResponse.status).toBe(200);
    const balanceData = await addBalanceResponse.json();
    expect(balanceData.success).toBe(true);

    // Get user transactions
    const transactionsResponse = await fetch(`http://localhost:3000/api/admin/users/${testUserId}/transactions`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(transactionsResponse.status).toBe(200);
    const transactionData = await transactionsResponse.json();
    expect(Array.isArray(transactionData.transactions)).toBe(true);
    expect(transactionData.transactions.length).toBeGreaterThan(0);
  });

  test('should access analytics and metrics', async () => {
    const response = await fetch('http://localhost:3000/api/admin/analytics', {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.metrics).toBeDefined();
    expect(data.metrics).toHaveProperty('total_users');
    expect(data.metrics).toHaveProperty('active_users');
    expect(data.metrics).toHaveProperty('total_transactions');
    expect(data.metrics).toHaveProperty('revenue');
  });
});