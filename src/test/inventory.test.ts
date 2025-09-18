import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

describe('Inventory System Tests', () => {
  let authToken: string;
  let testUser: any;
  let testItem: any;

  beforeAll(async () => {
    // Create a test user
    const { data: auth, error: authError } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'testpassword123'
    });

    if (authError) throw authError;
    
    authToken = auth.session?.access_token || '';
    testUser = auth.user;

    // Create a test item
    const { data: item, error: itemError } = await supabase
      .from('items')
      .insert({
        name: 'Test Item',
        type: 'Rifle',
        rarity: 'Common',
        value: 100,
        image_url: 'test.png'
      })
      .select()
      .single();

    if (itemError) throw itemError;
    testItem = item;

    // Add item to user's inventory
    const { error: invError } = await supabase
      .from('user_inventory')
      .insert({
        user_id: testUser.id,
        item_id: testItem.id,
        equipped: false,
        acquired_at: new Date().toISOString()
      });

    if (invError) throw invError;
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser && testItem) {
      await supabase
        .from('user_inventory')
        .delete()
        .eq('user_id', testUser.id);

      await supabase
        .from('items')
        .delete()
        .eq('id', testItem.id);

      await supabase.auth.admin.deleteUser(testUser.id);
    }
  });

  test('should fetch inventory items', async () => {
    const response = await fetch('http://localhost:3000/api/inventory', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(Array.isArray(data.inventory)).toBe(true);
    expect(data.inventory.length).toBeGreaterThan(0);
    
    const item = data.inventory[0];
    expect(item).toHaveProperty('id');
    expect(item).toHaveProperty('name');
    expect(item).toHaveProperty('type');
    expect(item).toHaveProperty('rarity');
    expect(item).toHaveProperty('image');
    expect(item).toHaveProperty('equipped');
  });

  test('should filter equipped items', async () => {
    const response = await fetch('http://localhost:3000/api/inventory?equipped=true', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(Array.isArray(data.inventory)).toBe(true);
    data.inventory.forEach((item: any) => {
      expect(item.equipped).toBe(true);
    });
  });

  test('should filter by item type', async () => {
    const response = await fetch('http://localhost:3000/api/inventory?filter=Rifle', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(Array.isArray(data.inventory)).toBe(true);
    data.inventory.forEach((item: any) => {
      expect(item.type).toBe('Rifle');
    });
  });

  test('should reject unauthorized requests', async () => {
    const response = await fetch('http://localhost:3000/api/inventory');
    expect(response.status).toBe(401);
  });

  test('should sell an item', async () => {
    // Get user's initial balance
    const { data: initialUser } = await supabase
      .from('users')
      .select('coins')
      .eq('id', testUser.id)
      .single();

    const sellPrice = 75; // 75% of item value (100)

    const response = await fetch('http://localhost:3000/api/inventory/sell', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        itemId: testItem.id,
        sellPrice
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.price).toBe(sellPrice);

    // Verify item was removed from inventory
    const { data: inventoryItem } = await supabase
      .from('user_inventory')
      .select('*')
      .eq('id', testItem.id)
      .single();

    expect(inventoryItem).toBeNull();

    // Verify user's balance was updated
    const { data: updatedUser } = await supabase
      .from('users')
      .select('coins')
      .eq('id', testUser.id)
      .single();

    expect(updatedUser?.coins).toBe((initialUser?.coins || 0) + sellPrice);

    // Verify transaction was recorded
    const { data: transaction } = await supabase
      .from('user_transactions')
      .select('*')
      .eq('user_id', testUser.id)
      .eq('item_id', testItem.id)
      .eq('type', 'sale')
      .single();

    expect(transaction).toBeTruthy();
    expect(transaction.amount).toBe(sellPrice);
  });

  test('should equip an item', async () => {
    // Create another test item to test slot replacement
    const { data: anotherItem } = await supabase
      .from('items')
      .insert({
        name: 'Another Test Item',
        type: 'Rifle',
        rarity: 'Common',
        value: 100,
        image_url: 'test2.png'
      })
      .select()
      .single();

    // Add it to inventory
    await supabase
      .from('user_inventory')
      .insert({
        user_id: testUser.id,
        item_id: anotherItem.id,
        equipped: false,
        acquired_at: new Date().toISOString()
      });

    // Equip first item
    const response1 = await fetch('http://localhost:3000/api/inventory/equip', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        itemId: testItem.id,
        slot: 'primary'
      })
    });

    expect(response1.status).toBe(200);
    const data1 = await response1.json();
    expect(data1.success).toBe(true);

    // Verify first item is equipped
    const { data: equipped1 } = await supabase
      .from('user_inventory')
      .select('*')
      .eq('id', testItem.id)
      .single();

    expect(equipped1.equipped).toBe(true);
    expect(equipped1.slot_type).toBe('primary');

    // Equip second item to same slot
    const response2 = await fetch('http://localhost:3000/api/inventory/equip', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        itemId: anotherItem.id,
        slot: 'primary'
      })
    });

    expect(response2.status).toBe(200);
    const data2 = await response2.json();
    expect(data2.success).toBe(true);

    // Verify first item is unequipped
    const { data: unequipped } = await supabase
      .from('user_inventory')
      .select('*')
      .eq('id', testItem.id)
      .single();

    expect(unequipped.equipped).toBe(false);
    expect(unequipped.slot_type).toBeNull();

    // Verify second item is equipped
    const { data: equipped2 } = await supabase
      .from('user_inventory')
      .select('*')
      .eq('id', anotherItem.id)
      .single();

    expect(equipped2.equipped).toBe(true);
    expect(equipped2.slot_type).toBe('primary');

    // Clean up the additional test item
    await supabase
      .from('user_inventory')
      .delete()
      .eq('item_id', anotherItem.id);

    await supabase
      .from('items')
      .delete()
      .eq('id', anotherItem.id);
  });

  test('should perform item trade-up', async () => {
    const tradeUpItems = [];

    // Create 10 identical items for trade up
    for (let i = 0; i < 10; i++) {
      const { data: item } = await supabase
        .from('items')
        .insert({
          name: `Trade Up Item ${i}`,
          type: 'Pistol',
          rarity: 'Consumer Grade',
          value: 10,
          image_url: 'tradeup.png'
        })
        .select()
        .single();

      // Add to user inventory
      const { data: inventoryItem } = await supabase
        .from('user_inventory')
        .insert({
          user_id: testUser.id,
          item_id: item.id,
          equipped: false,
          acquired_at: new Date().toISOString()
        })
        .select()
        .single();

      tradeUpItems.push(inventoryItem);
    }

    // Perform trade up
    const response = await fetch('http://localhost:3000/api/inventory/trade-up', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        itemIds: tradeUpItems.map(item => item.item_id)
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.newItem).toBeTruthy();

    // Verify original items are removed from inventory
    for (const item of tradeUpItems) {
      const { data: removed } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('item_id', item.item_id)
        .single();

      expect(removed).toBeNull();
    }

    // Verify new item exists and has correct properties
    const { data: newInventoryItem } = await supabase
      .from('user_inventory')
      .select('*, items(*)')
      .eq('id', data.newItem.id)
      .single();

    expect(newInventoryItem).toBeTruthy();
    expect(newInventoryItem.items.rarity).toBe('Industrial Grade');
    expect(newInventoryItem.items.value).toBeGreaterThan(10); // Should be worth more than input items

    // Clean up trade up items
    await supabase
      .from('user_inventory')
      .delete()
      .eq('id', data.newItem.id);

    await supabase
      .from('items')
      .delete()
      .eq('id', data.newItem.item_id);
  });

  test('should track user level progression', async () => {
    // Get initial user level
    const { data: initialUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUser.id)
      .single();

    const initialLevel = initialUser?.level || 1;
    const initialXp = initialUser?.xp || 0;

    // Simulate actions that grant XP
    const actions = [
      { type: 'OPEN_CASE', xp: 50 },
      { type: 'TRADE_UP', xp: 100 },
      { type: 'DAILY_LOGIN', xp: 25 }
    ];

    for (const action of actions) {
      const response = await fetch('http://localhost:3000/api/user/xp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: action.type,
          xp: action.xp
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    }

    // Get updated user info
    const { data: updatedUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUser.id)
      .single();

    // Calculate expected XP
    const totalXpGained = actions.reduce((sum, action) => sum + action.xp, 0);
    const expectedXp = initialXp + totalXpGained;

    // Verify XP and level changes
    expect(updatedUser?.xp).toBe(expectedXp);
    if (expectedXp >= 1000) { // Assuming 1000 XP per level
      expect(updatedUser?.level).toBeGreaterThan(initialLevel);
    } else {
      expect(updatedUser?.level).toBe(initialLevel);
    }

    // Reset user XP and level for other tests
    await supabase
      .from('users')
      .update({
        level: initialLevel,
        xp: initialXp
      })
      .eq('id', testUser.id);
  });
});