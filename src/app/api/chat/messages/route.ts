import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from "../../../../lib/auth-utils";
import { supabase } from "../../../../lib/supabase";
import { v4 as uuidv4 } from 'uuid';
import { getSocketServer } from "../../../../lib/socket-server";

// Get chat messages for a channel
export async function GET(request: NextRequest) {
  try {
    // Allow reading messages without auth
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId') || 'community-general';
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // For pagination

    let query = supabase
      .from('chat_messages')
      .select(`
        id,
        content,
        sender_id,
        channel_id,
        type,
        reply_to,
        created_at,
        updated_at,
        edited_at,
        is_deleted,
        sender:sender_id(id, displayname, avatar_url, role, level)
      `)
      .eq('channel_id', channelId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Database error:', error);
      // Return empty array - no mock data
      return NextResponse.json({ success: true, messages: [] });
    }

    // Reverse to show oldest first
    const orderedMessages = (messages || []).reverse();

    return NextResponse.json({
      success: true,
      messages: orderedMessages
    });

  } catch (error: unknown) {
    console.error('Get chat messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// Send a new chat message
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, channelId, type = 'text', replyTo } = await request.json();

    if (!content?.trim() || !channelId) {
      return NextResponse.json({ 
        error: 'Message content and channel are required' 
      }, { status: 400 });
    }

    // Check if channel exists and user has access
    const { data: channel, error: channelError } = await supabase
      .from('chat_channels')
      .select('*')
      .eq('id', channelId)
      .single();

    if (channelError || !channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Check if user is muted or banned
    const { data: userStatus } = await supabase
      .from('chat_user_status')
      .select('*')
      .eq('user_id', session.user_id)
      .eq('channel_id', channelId)
      .single();

    if (userStatus?.is_muted && new Date(userStatus.muted_until) > new Date()) {
      return NextResponse.json({ 
        error: 'You are muted in this channel' 
      }, { status: 403 });
    }

    if (userStatus?.is_banned) {
      return NextResponse.json({ 
        error: 'You are banned from this channel' 
      }, { status: 403 });
    }

    // Rate limiting - check recent messages
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const { count } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('sender_id', session.user_id)
      .eq('channel_id', channelId)
      .gte('created_at', fiveMinutesAgo.toISOString());

    if ((count || 0) >= 10) { // Max 10 messages per 5 minutes
      return NextResponse.json({ 
        error: 'You are sending messages too fast. Please slow down.' 
      }, { status: 429 });
    }

    // Create the message
    const messageId = uuidv4();
    const { data: message, error: messageError } = await supabase
      .from('chat_messages')
      .insert({
        id: messageId,
        content: content.trim(),
        sender_id: session.user_id,
        channel_id: channelId,
        type,
        reply_to: replyTo || null,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        sender:users(id, display_name, avatar_url, role, level)
      `)
      .single();

    if (messageError) {
      console.error('Failed to create message:', messageError);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // Update channel's last message timestamp
    await supabase
      .from('chat_channels')
      .update({ 
        last_message_at: new Date().toISOString(),
        message_count: channel.message_count + 1 
      })
      .eq('id', channelId);

    // Broadcast message via Socket.IO to all users in the channel
    try {
      const io = getSocketServer();
      if (io) {
        io.to(`chat:${channelId}`).emit('new-message', {
          id: message.id,
          message: message.content,
          content: message.content,
          sender: message.sender,
          senderId: message.sender_id,
          senderName: message.sender?.display_name,
          senderAvatar: message.sender?.avatar_url,
          senderRole: message.sender?.role,
          channelId: message.channel_id,
          timestamp: message.created_at,
          type: message.type
        });
        console.log(`📤 Broadcasted message to chat:${channelId}`);
      }
    } catch (socketError) {
      console.error('Failed to broadcast via Socket.IO:', socketError);
      // Continue anyway - message is saved in DB
    }
    
    return NextResponse.json({
      success: true,
      message: {
        ...message,
        timestamp: message.created_at
      }
    });

  } catch (error: unknown) {
    console.error('Send chat message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

// Delete a message (admin/moderator only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Get the message
    const { data: message, error: fetchError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (fetchError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check permissions - user can delete own messages, admins/mods can delete any
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user_id)
      .single();

    const canDelete = message.sender_id === session.user_id || 
                     ['admin', 'moderator'].includes(user?.role || '');

    if (!canDelete) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Soft delete - mark as deleted instead of removing
    const { error: deleteError } = await supabase
      .from('chat_messages')
      .update({ 
        content: '[Message deleted]',
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: session.user_id
      })
      .eq('id', messageId);

    if (deleteError) {
      console.error('Failed to delete message:', deleteError);
      return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error: unknown) {
    console.error('Delete chat message error:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}