import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-utils';
import { getDb, getAll, run } from '@/lib/db';
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

    const db = await getDb();

    // Get target user IDs based on selection
    let userIds: string[] = [];
    
    if (targetUsers === 'all') {
      const allUsers = await getAll<{ id: string }>('SELECT id FROM users');
      userIds = allUsers.map(user => user.id);
    } else if (targetUsers === 'admin') {
      const adminUsers = await getAll<{ id: string }>('SELECT id FROM users WHERE role = ?', ['admin']);
      userIds = adminUsers.map(user => user.id);
    } else if (targetUsers === 'moderator') {
      const modUsers = await getAll<{ id: string }>('SELECT id FROM users WHERE role = ?', ['moderator']);
      userIds = modUsers.map(user => user.id);
    } else if (targetUsers === 'user') {
      const regularUsers = await getAll<{ id: string }>('SELECT id FROM users WHERE role = ?', ['user']);
      userIds = regularUsers.map(user => user.id);
    }

    // Send message to all target users
    const messagePromises = userIds.map(userId => {
      const messageId = uuidv4();
      return run(`
        INSERT INTO private_messages (
          id, from_user_id, to_user_id, type, subject, content, read, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        messageId,
        session.user_id,
        userId,
        type,
        subject,
        content,
        false,
        new Date().toISOString()
      ]);
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
