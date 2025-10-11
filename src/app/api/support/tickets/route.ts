import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from "../../../../lib/auth-utils";
import { supabase } from "../../../../lib/supabase";
import { v4 as uuidv4 } from 'uuid';

// GET - Fetch tickets (for users: their own tickets, for mods/admins: all tickets)
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', session.user_id)
      .single();
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    let tickets;
    try {
      if (user.role === 'admin' || user.role === 'moderator') {
        // Admins and moderators can see all tickets
        const { data, error } = await supabase
          .from('support_tickets')
          .select(`
            *,
            user:users!support_tickets_user_id_fkey(id, displayname, email),
            assigned:users!support_tickets_assigned_to_fkey(id, displayname)
          `)
          .order('created_at', { ascending: false });
        if (error) {
          // If table doesn't exist, return empty array
          if (error.code === '42P01') {
            return NextResponse.json({ tickets: [] });
          }
          return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
        }
        tickets = data;
      } else {
        // Regular users can only see their own tickets
        const { data, error } = await supabase
          .from('support_tickets')
          .select(`
            *,
            user:users!support_tickets_user_id_fkey(id, displayname, email),
            assigned:users!support_tickets_assigned_to_fkey(id, displayname)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) {
          // If table doesn't exist, return empty array
          if (error.code === '42P01') {
            return NextResponse.json({ tickets: [] });
          }
          return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
        }
        tickets = data;
      }
    } catch (tableError) {
      console.error('Support tickets table error:', tableError);
      return NextResponse.json({ tickets: [] });
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

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', session.user_id)
      .single();
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const ticketId = uuidv4();
    const now = new Date().toISOString();
    // Create the ticket
    await supabase.from('support_tickets').insert({
      id: ticketId,
      user_id: user.id,
      subject,
      description,
      category,
      created_at: now,
      updated_at: now
    });
    // Notify all moderators and admins about the new ticket
    const { data: staff } = await supabase
      .from('users')
      .select('id')
      .in('role', ['admin', 'moderator']);
    for (const staffMember of staff || []) {
      const notificationId = uuidv4();
      await supabase.from('notifications').insert({
        id: notificationId,
        user_id: staffMember.id,
        type: 'support_ticket',
        title: 'New Support Ticket',
        message: `New support ticket: ${subject}`,
        data: JSON.stringify({ ticketId, category })
      });
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
