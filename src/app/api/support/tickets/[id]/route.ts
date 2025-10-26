import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from "../../../../../lib/auth-utils";
import { supabase } from "../../../../../lib/supabase";
import { v4 as uuidv4 } from 'uuid';

// GET - Get specific ticket with replies
export async function GET(
  request: NextRequest,
  { params }: any
) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', session.user_id)
      .single();
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get ticket details (with user and assigned info)
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select(`*, user:users!support_tickets_user_id_fkey(displayname, email), assigned:users!support_tickets_assigned_to_fkey(displayname)`) // adjust join keys as needed
      .eq('id', params.id)
      .single();
    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check if user has permission to view this ticket
    if (user.role !== 'admin' && user.role !== 'moderator' && ticket.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get ticket replies (with user info)
    const { data: replies, error: repliesError } = await supabase
      .from('support_ticket_replies')
      .select('*, user:users!support_ticket_replies_user_id_fkey(displayname, role)') // adjust join keys as needed
      .eq('ticket_id', params.id)
      .order('created_at', { ascending: true });
    if (repliesError) {
      return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 });
    }

    // Flatten user fields for compatibility
    const ticketOut = {
      ...ticket,
  user_name: ticket.user?.displayname ?? null,
      user_email: ticket.user?.email ?? null,
  assigned_to_name: ticket.assigned?.displayname ?? null,
    };
    const repliesOut = (replies || []).map((r: any) => ({
      ...r,
  user_name: r.user?.displayname ?? null,
      user_role: r.user?.role ?? null,
    }));

    return NextResponse.json({ ticket: ticketOut, replies: repliesOut });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update ticket status, priority, or assignment
export async function PUT(
  request: NextRequest,
  { params }: any
) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', session.user_id)
      .single();
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only staff can update tickets
    if (user.role !== 'admin' && user.role !== 'moderator') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { status, priority, assigned_to } = await request.json();

    // Check if ticket exists
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id')
      .eq('id', params.id)
      .single();
    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Prepare update object
    const updateObj: any = { updated_at: new Date().toISOString() };
    if (status) {
      updateObj.status = status;
      if (status === 'resolved' || status === 'closed') {
        updateObj.resolved_at = new Date().toISOString();
      }
    }
    if (priority) {
      updateObj.priority = priority;
    }
    if (assigned_to !== undefined) {
      updateObj.assigned_to = assigned_to || null;
    }
    // If no valid updates
    if (Object.keys(updateObj).length === 1) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    // Update ticket
    const { error: updateError } = await supabase
      .from('support_tickets')
      .update(updateObj)
      .eq('id', params.id);
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Ticket updated successfully' 
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}