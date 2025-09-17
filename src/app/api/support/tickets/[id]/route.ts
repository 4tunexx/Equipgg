import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';
import { getDb, getOne, getAll, run, runAndGetId } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// GET - Get specific ticket with replies
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get ticket details
    const ticket = await getOne(`
      SELECT 
        st.*,
        u.displayName as user_name,
        u.email as user_email,
        assigned.displayName as assigned_to_name
      FROM support_tickets st
      LEFT JOIN users u ON st.user_id = u.id
      LEFT JOIN users assigned ON st.assigned_to = assigned.id
      WHERE st.id = ?
    `, [params.id]);

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check if user has permission to view this ticket
    if (user.role !== 'admin' && user.role !== 'moderator' && ticket.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get ticket replies
    const replies = await getAll(`
      SELECT 
        str.*,
        u.displayName as user_name,
        u.role as user_role
      FROM support_ticket_replies str
      LEFT JOIN users u ON str.user_id = u.id
      WHERE str.ticket_id = ?
      ORDER BY str.created_at ASC
    `, [params.id]);

    return NextResponse.json({ ticket, replies });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update ticket status, priority, or assignment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Only staff can update tickets
    if (user.role !== 'admin' && user.role !== 'moderator') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { status, priority, assigned_to } = await request.json();

    // Check if ticket exists
    const ticket = await getOne('SELECT id FROM support_tickets WHERE id = ?', [params.id]);

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const updates = [];
    const values = [];

    if (status) {
      updates.push('status = ?');
      values.push(status);
      
      // Set resolved_at if status is resolved or closed
      if (status === 'resolved' || status === 'closed') {
        updates.push('resolved_at = ?');
        values.push(new Date().toISOString());
      }
    }

    if (priority) {
      updates.push('priority = ?');
      values.push(priority);
    }

    if (assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      values.push(assigned_to || null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    // Always update the updated_at timestamp
    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(params.id);

    await run(`
      UPDATE support_tickets 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, values);

    return NextResponse.json({ 
      success: true, 
      message: 'Ticket updated successfully' 
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}