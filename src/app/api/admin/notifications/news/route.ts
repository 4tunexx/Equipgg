import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from "../../../../../lib/auth-utils";
import secureDb from "../../../../../lib/secureDb";
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  role: string;
}

// Helper function to send news updates to users
async function sendNewsUpdate(userIds: string[], title: string, message: string) {
  const notifications = userIds.map(userId => ({
    id: uuidv4(),
    type: 'news',
    title,
    message,
    userId,
    createdAt: new Date().toISOString(),
    read: false,
    severity: 'low',
    metadata: {
      type: 'news_update'
    }
  }));

  return await secureDb.insert('notifications', notifications);
}

// POST - Send news update to users
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
      users = (result as any[]) || [];
    } else {
      // For specific roles, we need to use raw query since secureDb.select doesn't support WHERE clauses directly
      const result = await secureDb.raw(`
        SELECT id, role FROM users WHERE role = '${targetUsers}'
      `);
      users = (result as any[]) || [];
    }

    if (users.length === 0) {
      return NextResponse.json({ error: 'No users found for target group' }, { status: 400 });
    }

    const userIds = users.map(user => user.id);

    // Send news update to all target users
    await sendNewsUpdate(userIds, title, message);

    return NextResponse.json({ 
      success: true, 
      message: `News update sent to ${userIds.length} users`,
      targetUsers: userIds.length
    });

  } catch (error) {
    console.error('Error sending news update:', error);
    return NextResponse.json({ error: 'Failed to send news update' }, { status: 500 });
  }
}
