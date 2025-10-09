import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '../../../../lib/auth-utils';
import secureDb from '../../../../lib/secureDb';
import { v4 as uuidv4 } from 'uuid';

/**
 * Admin Messages Broadcast Endpoint
 * POST /api/admin/messages
 * Body: { type: string; subject: string; content: string; targetUsers: 'all'|'admin'|'moderator'|'user' }
 * Creates notification rows for each targeted user.
 * Response: { success: true, sentTo: number }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session || session.role !== 'admin') {
      return createUnauthorizedResponse();
    }

    const { type, subject, content, targetUsers = 'all' } = await request.json();

    if (!subject || !content) {
      return NextResponse.json({ error: 'Subject and content are required' }, { status: 400 });
    }

    // Basic allow-list for types we accept (extendable)
    const allowedTypes = [
      'news',
      'update',
      'admin_announcement',
      'mod_announcement',
      'system_notification'
    ];
    const messageType = allowedTypes.includes(type) ? type : 'news';

    // Fetch target users
    let users: any[] = [];
    if (targetUsers === 'all') {
      users = await secureDb.select('users', { columns: 'id, role' });
    } else {
      // Use raw since select helper lacks where operators beyond equality chaining
      users = await secureDb.raw(`SELECT id, role FROM users WHERE role = '${targetUsers}'`);
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'No users found for target group' }, { status: 404 });
    }

    const now = new Date().toISOString();

    // Map message type to severity / metadata
    const severityMap: Record<string, string> = {
      news: 'low',
      update: 'medium',
      admin_announcement: 'high',
      mod_announcement: 'medium',
      system_notification: 'high'
    };

    const severity = severityMap[messageType] || 'low';

    const notifications = users.map(u => ({
      id: uuidv4(),
      type: messageType,
      title: subject,
      message: content,
      userId: u.id,
      createdAt: now,
      read: false,
      severity,
      metadata: { broadcast: true, target: targetUsers }
    }));

    // Insert in batches to avoid payload size issues if user count large
    const batchSize = 500;
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      await secureDb.insert('notifications', batch);
    }

    return NextResponse.json({ success: true, sentTo: notifications.length });
  } catch (error) {
    console.error('Admin messages broadcast error:', error);
    return NextResponse.json({ error: 'Failed to send messages' }, { status: 500 });
  }
}
