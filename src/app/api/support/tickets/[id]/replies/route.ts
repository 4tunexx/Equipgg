import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';
import { getDb, getOne, run, runAndGetId } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// POST - Add a reply to a ticket
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const { message, is_internal = false } = await request.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const db = await getDb();
    const user = await getOne<{id: string, role: string}>('SELECT id, role FROM users WHERE id = ?', [session.user_id]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if ticket exists and user has permission
    const ticket = await getOne<{user_id: string}>('SELECT user_id FROM support_tickets WHERE id = ?', [params.id]);

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check permissions
    const canReply = user.role === 'admin' || 
                    user.role === 'moderator' || 
                    ticket.user_id === user.id;

    if (!canReply) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Only staff can create internal notes
    if (is_internal && user.role !== 'admin' && user.role !== 'moderator') {
      return NextResponse.json({ error: 'Only staff can create internal notes' }, { status: 403 });
    }

    const replyId = uuidv4();
    const now = new Date().toISOString();

    // Create the reply
    await run(`
      INSERT INTO support_ticket_replies (id, ticket_id, user_id, message, is_internal, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [replyId, params.id, user.id, message.trim(), is_internal, now]);

    // Update ticket's updated_at timestamp
    await run('UPDATE support_tickets SET updated_at = ? WHERE id = ?', [now, params.id]);

    // If this is a staff reply to a user's ticket, notify the user
    if ((user.role === 'admin' || user.role === 'moderator') && !is_internal && ticket.user_id !== user.id) {
      const notificationId = uuidv4();
      await run(`
        INSERT INTO notifications (id, user_id, type, title, message, data)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        notificationId,
        ticket.user_id,
        'support_reply',
        'Support Ticket Reply',
        'You have received a reply to your support ticket',
        JSON.stringify({ ticketId: params.id })
      ]);
    }

    return NextResponse.json({ 
      success: true, 
      replyId,
      message: 'Reply added successfully' 
    });
  } catch (error) {
    console.error('Error adding reply:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
