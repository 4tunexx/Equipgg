import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from "../../../../../../lib/auth-utils";
import { supabase } from "../../../../../../lib/supabase";
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

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', session.user_id)
      .single();
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if ticket exists and get owner
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('user_id')
      .eq('id', params.id)
      .single();
    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check permissions
    const canReply = user.role === 'admin' || user.role === 'moderator' || ticket.user_id === user.id;
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
    const { error: replyError } = await supabase
      .from('support_ticket_replies')
      .insert({
        id: replyId,
        ticket_id: params.id,
        user_id: user.id,
        message: message.trim(),
        is_internal,
        created_at: now,
      });
    if (replyError) {
      return NextResponse.json({ error: 'Failed to add reply' }, { status: 500 });
    }

    // Update ticket's updated_at timestamp
    await supabase
      .from('support_tickets')
      .update({ updated_at: now })
      .eq('id', params.id);

    // If this is a staff reply to a user's ticket, notify the user
    if ((user.role === 'admin' || user.role === 'moderator') && !is_internal && ticket.user_id !== user.id) {
      const notificationId = uuidv4();
      await supabase
        .from('notifications')
        .insert({
          id: notificationId,
          user_id: ticket.user_id,
          type: 'support_reply',
          title: 'Support Ticket Reply',
          message: 'You have received a reply to your support ticket',
          data: JSON.stringify({ ticketId: params.id }),
        });
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
