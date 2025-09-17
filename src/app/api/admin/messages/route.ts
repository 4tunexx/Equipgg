import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-utils';
import { secureDb } from '@/lib/secure-db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, subject, content, targetUsers } = await request.json();

    if (!type || !subject || !content || !targetUsers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get target user IDs based on selection using secureDb
    let userIds: string[] = [];
    if (targetUsers === 'all') {
      const allUsers = await secureDb.findMany<{ id: string }>('users');
      userIds = allUsers.map(user => user.id);
    } else if (targetUsers === 'admin') {
      const adminUsers = await secureDb.findMany<{ id: string }>('users', { role: 'admin' });
      userIds = adminUsers.map(user => user.id);
    } else if (targetUsers === 'moderator') {
      const modUsers = await secureDb.findMany<{ id: string }>('users', { role: 'moderator' });
      userIds = modUsers.map(user => user.id);
    } else if (targetUsers === 'user') {
      const regularUsers = await secureDb.findMany<{ id: string }>('users', { role: 'user' });
      userIds = regularUsers.map(user => user.id);
    }

    // Send message to all target users using secureDb.create
    const messagePromises = userIds.map(userId => {
      const messageId = uuidv4();
      return secureDb.create('private_messages', {
        id: messageId,
        from_user_id: session.user_id,
        to_user_id: userId,
        type,
        subject,
        content,
        read: false,
        created_at: new Date().toISOString()
      });
    });
    await Promise.all(messagePromises);

    return NextResponse.json({
      success: true,
      message: `Message sent to ${userIds.length} users`,
      sentTo: userIds.length
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
