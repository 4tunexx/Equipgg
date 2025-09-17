import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';
import { AdminNotifications } from '@/lib/notification-utils';
import { getDb, getAll } from '@/lib/db';

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

    const db = await getDb();
    let userIds: string[] = [];

    // Get target user IDs based on selection
    if (targetUsers === 'all') {
      const users = getAll('SELECT id FROM users', []);
      userIds = users.map((user: any) => user.id);
    } else {
      const users = getAll('SELECT id FROM users WHERE role = ?', [targetUsers]);
      userIds = users.map((user: any) => user.id);
    }

    if (userIds.length === 0) {
      return NextResponse.json({ error: 'No users found for target group' }, { status: 400 });
    }

    // Send news update to all target users
    await AdminNotifications.newsUpdate(userIds, title, message);

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
