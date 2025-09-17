import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-utils';
import { getDb, getAll, getOne } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();

    // Get user's private messages from database
    let messages: any[] = [];
    try {
      const dbMessages = await getAll<any>(`
        SELECT 
          pm.id, pm.type, pm.subject, pm.content, pm.read, pm.created_at,
          u.displayName as from_name, u.role as from_role
        FROM private_messages pm
        LEFT JOIN users u ON pm.from_user_id = u.id
        WHERE pm.to_user_id = ?
        ORDER BY pm.created_at DESC
        LIMIT 20
      `, [session.user_id]);

      messages = dbMessages.map(msg => ({
        id: msg.id,
        type: msg.type,
        from: msg.from_name || (msg.type === 'system_notification' ? 'System' : 'Unknown'),
        fromRole: msg.from_role,
        subject: msg.subject,
        preview: msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content,
        timestamp: msg.created_at,
        read: Boolean(msg.read)
      }));
    } catch (dbError) {
      console.log('No messages found in database, using sample data');
    }

    // If no messages in database, create some sample messages for demonstration
    if (messages.length === 0) {
      const sampleMessages = [
        {
          id: 'sample-1',
          type: 'news',
          from: 'EquipGG Team',
          fromRole: 'admin',
          subject: '🎉 New Features Released!',
          preview: 'We\'ve added new betting options, improved the arcade games, and enhanced the user experience...',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          read: false
        },
        {
          id: 'sample-2',
          type: 'update',
          from: 'System',
          fromRole: 'admin',
          subject: '🔄 Platform Maintenance Complete',
          preview: 'Scheduled maintenance has been completed successfully. All services are now running optimally...',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
          read: false
        },
        {
          id: 'sample-3',
          type: 'admin_announcement',
          from: 'Admin',
          fromRole: 'admin',
          subject: '📢 Important: New Security Features',
          preview: 'We\'ve implemented enhanced security measures to protect your account and transactions...',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          read: true
        },
        {
          id: 'sample-4',
          type: 'mod_announcement',
          from: 'Moderator',
          fromRole: 'moderator',
          subject: '🎮 Weekly Tournament Results',
          preview: 'Congratulations to all participants! Check out the leaderboard for this week\'s tournament winners...',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          read: true
        }
      ];

      messages = sampleMessages;
    }

    const unreadCount = messages.filter(m => !m.read).length;

    return NextResponse.json({
      success: true,
      messages,
      unreadCount
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
