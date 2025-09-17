import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';
import { AdminNotifications } from '@/lib/notification-utils';
import { getDb, getAll } from '@/lib/db';

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

    // Send announcement to all target users
    await AdminNotifications.siteAnnouncement(userIds, title, message);

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
