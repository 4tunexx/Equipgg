import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';
import { getDb, getOne, getAll, run, runAndGetId } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// GET - Fetch tickets (for users: their own tickets, for mods/admins: all tickets)
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const db = await getDb();
    const user = await getOne<{id: string, role: string}>('SELECT id, role FROM users WHERE id = ?', [session.user_id]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let tickets;
    
    if (user.role === 'admin' || user.role === 'moderator') {
      // Admins and moderators can see all tickets
      tickets = await getAll(`
        SELECT 
          st.*,
          u.displayName as user_name,
          u.email as user_email,
          assigned.displayName as assigned_to_name
        FROM support_tickets st
        LEFT JOIN users u ON st.user_id = u.id
        LEFT JOIN users assigned ON st.assigned_to = assigned.id
        ORDER BY st.created_at DESC
      `);
    } else {
      // Regular users can only see their own tickets
      tickets = await getAll(`
        SELECT 
          st.*,
          u.displayName as user_name,
          u.email as user_email,
          assigned.displayName as assigned_to_name
        FROM support_tickets st
        LEFT JOIN users u ON st.user_id = u.id
        LEFT JOIN users assigned ON st.assigned_to = assigned.id
        WHERE st.user_id = ?
        ORDER BY st.created_at DESC
      `, [user.id]);
    }

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new support ticket
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const { subject, description, category } = await request.json();

    if (!subject || !description || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await getDb();
    const user = await getOne<{id: string}>('SELECT id FROM users WHERE id = ?', [session.user_id]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const ticketId = uuidv4();
    const now = new Date().toISOString();

    // Create the ticket
    await run(`
      INSERT INTO support_tickets (id, user_id, subject, description, category, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [ticketId, user.id, subject, description, category, now, now]);

    // Notify all moderators and admins about the new ticket
    const staff = await getAll<{id: string}>('SELECT id FROM users WHERE role IN (?, ?)', ['admin', 'moderator']);
    
    for (const staffMember of staff) {
      const notificationId = uuidv4();
      await run(`
        INSERT INTO notifications (id, user_id, type, title, message, data)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        notificationId,
        staffMember.id,
        'support_ticket',
        'New Support Ticket',
        `New support ticket: ${subject}`,
        JSON.stringify({ ticketId, category })
      ]);
    }

    return NextResponse.json({ 
      success: true, 
      ticketId,
      message: 'Support ticket created successfully' 
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
