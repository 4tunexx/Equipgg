import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getAuthSession } from '@/lib/auth-utils';
import { createNotification } from '@/lib/notification-utils';

// GET - Fetch user's messages
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationWith = searchParams.get('with');

    const supabase = createServerSupabaseClient();

    if (conversationWith) {
      // Fetch specific conversation
    const { data: messages, error } = await supabase
        .from('direct_messages')
        .select('*, sender:users!sender_id(username, displayname, avatar_url), receiver:users!receiver_id(username, displayname, avatar_url)')
        .or(`and(sender_id.eq.${session.user_id},receiver_id.eq.${conversationWith}),and(sender_id.eq.${conversationWith},receiver_id.eq.${session.user_id})`)
        .order('created_at', { ascending: true })
        .limit(100);

    if (error) {
      console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        messages: messages || []
      });
    } else {
      // Fetch all messages for this user
      const { data: messages, error } = await supabase
        .from('direct_messages')
        .select('*, sender:users!sender_id(id, username, displayname, avatar_url, role)')
        .or(`sender_id.eq.${session.user_id},receiver_id.eq.${session.user_id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        messages: messages || []
      });
    }

  } catch (error) {
    console.error('Messages GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Send a message
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { receiverId, content } = await request.json();

    if (!receiverId || !content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Receiver ID and message content are required' },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Message is too long (max 1000 characters)' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Check if receiver exists
    const { data: receiver, error: receiverError } = await supabase
      .from('users')
      .select('id, username, displayname')
      .eq('id', receiverId)
      .single();

    if (receiverError || !receiver) {
      return NextResponse.json(
        { error: 'Receiver not found' },
        { status: 404 }
      );
    }

    // Insert message
    const { data: message, error: insertError } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: session.user_id,
        receiver_id: receiverId,
        content: content.trim(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error sending message:', insertError);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    // Get sender info for notification
    const { data: senderData } = await supabase
      .from('users')
      .select('username, displayname')
      .eq('id', session.user_id)
      .single();

    // Create notification for receiver
    await createNotification({
      userId: receiverId,
      type: 'new_message',
      title: '💬 New Message',
      message: `You have a new message from ${senderData?.displayname || senderData?.username || 'a user'}`,
      data: {
        senderId: session.user_id,
        messageId: message.id,
        navigationPath: '/dashboard/messages'
      }
    });

    return NextResponse.json({
      success: true,
      message
    });

  } catch (error) {
    console.error('Messages POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
