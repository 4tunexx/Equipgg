import { createClient } from '@supabase/supabase-js';
import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

describe('Moderator Functions', () => {
  let modToken: string;
  let testUserId: string;
  let testChatId: string;

  beforeAll(async () => {
    // Sign in as moderator
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'mod@test.com',
      password: 'testmod123'
    });

    modToken = authData?.session?.access_token || '';

    // Create test user
    const { data: userData } = await supabase.auth.signUp({
      email: 'modtest@test.com',
      password: 'test123'
    });

    testUserId = userData?.user?.id || '';

    // Create test chat room
    const { data: chatData } = await supabase
      .from('chat_rooms')
      .insert({ name: 'Test Chat' })
      .select()
      .single();

    testChatId = chatData?.id;
  });

  afterAll(async () => {
    // Clean up test data
    await supabase
      .from('chat_rooms')
      .delete()
      .eq('id', testChatId);

    await supabase
      .from('users')
      .delete()
      .eq('id', testUserId);

    await supabase.auth.signOut();
  });

  test('should moderate chat messages', async () => {
    // Add test message
    const addMessageResponse = await fetch('http://localhost:3000/api/chat/message', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${modToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        roomId: testChatId,
        content: 'Test message',
        userId: testUserId
      })
    });

    expect(addMessageResponse.status).toBe(200);
    const messageData = await addMessageResponse.json();

    // Delete message as moderator
    const deleteResponse = await fetch(`http://localhost:3000/api/moderator/chat/message/${messageData.message.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${modToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(deleteResponse.status).toBe(200);
    const deleteData = await deleteResponse.json();
    expect(deleteData.success).toBe(true);

    // Verify message is deleted
    const { data: deletedMessage } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('id', messageData.message.id)
      .single();

    expect(deletedMessage).toBeNull();
  });

  test('should handle user reports', async () => {
    // Create test report
    const createReportResponse = await fetch('http://localhost:3000/api/moderator/reports', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${modToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reportedUserId: testUserId,
        reason: 'Test report',
        description: 'Testing report handling'
      })
    });

    expect(createReportResponse.status).toBe(200);
    const reportData = await createReportResponse.json();

    // Get reports list
    const listResponse = await fetch('http://localhost:3000/api/moderator/reports', {
      headers: {
        'Authorization': `Bearer ${modToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(listResponse.status).toBe(200);
    const listData = await listResponse.json();
    expect(Array.isArray(listData.reports)).toBe(true);
    expect(listData.reports.length).toBeGreaterThan(0);

    // Handle report
    const handleResponse = await fetch(`http://localhost:3000/api/moderator/reports/${reportData.report.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${modToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'resolved',
        resolution: 'Test resolution'
      })
    });

    expect(handleResponse.status).toBe(200);
    const handleData = await handleResponse.json();
    expect(handleData.report.status).toBe('resolved');
  });

  test('should manage chat timeouts', async () => {
    // Timeout user
    const timeoutResponse = await fetch('http://localhost:3000/api/moderator/chat/timeout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${modToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: testUserId,
        duration: 300, // 5 minutes
        reason: 'Test timeout'
      })
    });

    expect(timeoutResponse.status).toBe(200);
    const timeoutData = await timeoutResponse.json();
    expect(timeoutData.success).toBe(true);

    // Verify user is timed out
    const { data: timedOutUser } = await supabase
      .from('users')
      .select('chat_timeout_until')
      .eq('id', testUserId)
      .single();

    expect(timedOutUser?.chat_timeout_until).toBeTruthy();

    // Remove timeout
    const removeTimeoutResponse = await fetch('http://localhost:3000/api/moderator/chat/timeout', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${modToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: testUserId
      })
    });

    expect(removeTimeoutResponse.status).toBe(200);
    const removeData = await removeTimeoutResponse.json();
    expect(removeData.success).toBe(true);
  });

  test('should monitor chat activity', async () => {
    const response = await fetch('http://localhost:3000/api/moderator/chat/activity', {
      headers: {
        'Authorization': `Bearer ${modToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.activity).toBeDefined();
    expect(data.activity).toHaveProperty('message_count');
    expect(data.activity).toHaveProperty('active_users');
    expect(data.activity).toHaveProperty('reported_messages');
  });

  test('should manage word filters', async () => {
    // Add filtered word
    const addFilterResponse = await fetch('http://localhost:3000/api/moderator/chat/filters', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${modToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        word: 'badword',
        replacement: '***'
      })
    });

    expect(addFilterResponse.status).toBe(200);
    const filterData = await addFilterResponse.json();
    expect(filterData.success).toBe(true);

    // Get filters
    const getFiltersResponse = await fetch('http://localhost:3000/api/moderator/chat/filters', {
      headers: {
        'Authorization': `Bearer ${modToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(getFiltersResponse.status).toBe(200);
    const filtersData = await getFiltersResponse.json();
    expect(Array.isArray(filtersData.filters)).toBe(true);
    expect(filtersData.filters.length).toBeGreaterThan(0);

    // Remove filter
    const removeFilterResponse = await fetch('http://localhost:3000/api/moderator/chat/filters', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${modToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        word: 'badword'
      })
    });

    expect(removeFilterResponse.status).toBe(200);
    const removeData = await removeFilterResponse.json();
    expect(removeData.success).toBe(true);
  });
});