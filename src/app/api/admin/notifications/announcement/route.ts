import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';
import secureDb from '@/lib/secureDb';
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  role: string;
}

// Helper function to send announcement to users
async function sendAnnouncement(userIds: string[], title: string, message: string) {
  const notifications = userIds.map(userId => ({
    id: uuidv4(),
    type: 'announcement',
    title,
    message,
    userId,
    createdAt: new Date().toISOString(),
    read: false,
    severity: 'medium',
    metadata: {
      type: 'site_announcement'
    }
  }));

  return await secureDb.insert('notifications', notifications);
}

// POST - Send announcement to users
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session || session.role !== 'admin') {
      return createUnauthorizedResponse();
    }

    const { title, message, targetUsers = 'all' } = await request.json();

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    let users: User[] = [];
    // Get target user IDs based on selection
    if (targetUsers === 'all') {
      const result = await secureDb.select('users');
      users = result || [];
    } else {
      // For specific roles, we need to use raw query since secureDb.select doesn't support WHERE clauses directly
      const result = await secureDb.raw(`
        SELECT id, role FROM users WHERE role = '${targetUsers}'
      `);
      users = result || [];
    }

    if (users.length === 0) {
      return NextResponse.json({ error: 'No users found for target group' }, { status: 400 });
    }

    const userIds = users.map(user => user.id);

    if (userIds.length === 0) {
      return NextResponse.json({ error: 'No users found for target group' }, { status: 400 });
    }

    // Send announcement to all target users
    await sendAnnouncement(userIds, title, message);

    return NextResponse.json({ 
      success: true, 
      message: `Announcement sent to ${userIds.length} users`,
      targetUsers: userIds.length
    });

  } catch (error) {
    console.error('Error sending announcement:', error);
    return NextResponse.json({ error: 'Failed to send announcement' }, { status: 500 });
  }
}
