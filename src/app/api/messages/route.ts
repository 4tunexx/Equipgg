import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from '../../../lib/auth-utils';
import { supabase } from "../../../lib/supabase";

// Global chat/messages system
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const channel = searchParams.get('channel') || 'global';

    // Get recent messages
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select(`
        id,
        message,
        created_at,
        channel,
        users (
          id,
          displayname,
          vip_tier,
          level,
          role
        )
      `)
      .eq('channel', channel)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // If table doesn't exist, return mock data
    if (error && error.code === 'PGRST116') {
      const mockMessages = [
        {
          id: '1',
          message: 'Welcome to EquipGG! 🎮',
          created_at: new Date().toISOString(),
          channel: 'global',
          users: {
            id: 'system',
            displayname: 'System',
            vip_tier: null,
            level: 1,
            role: 'system'
          }
        },
        {
          id: '2',
          message: 'Chat system coming soon!',
          created_at: new Date(Date.now() - 60000).toISOString(),
          channel: 'global',
          users: {
            id: 'system',
            displayname: 'System',
            vip_tier: null,
            level: 1,
            role: 'system'
          }
        }
      ];

      return NextResponse.json({
        success: true,
        messages: mockMessages,
        hasMore: false
      });
    }

    return NextResponse.json({
      success: true,
      messages: messages || [],
      hasMore: (messages?.length || 0) === limit
    });

  } catch (error) {
    console.error('Error in messages GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, channel = 'global' } = await request.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Message cannot be empty' 
      }, { status: 400 });
    }

    if (message.trim().length > 500) {
      return NextResponse.json({ 
        error: 'Message too long (max 500 characters)' 
      }, { status: 400 });
    }

    // Basic profanity filter (simple implementation)
    const bannedWords = ['spam', 'scam', 'hack'];
    const lowerMessage = message.toLowerCase();
    if (bannedWords.some(word => lowerMessage.includes(word))) {
      return NextResponse.json({ 
        error: 'Message contains inappropriate content' 
      }, { status: 400 });
    }

    // Check user's last message time (rate limiting)
    const { data: lastMessage } = await supabase
      .from('chat_messages')
      .select('created_at')
      .eq('user_id', session.user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lastMessage) {
      const lastMessageTime = new Date(lastMessage.created_at);
      const timeDiff = Date.now() - lastMessageTime.getTime();
      const cooldownMs = 3000; // 3 seconds cooldown

      if (timeDiff < cooldownMs) {
        return NextResponse.json({ 
          error: `Please wait ${Math.ceil((cooldownMs - timeDiff) / 1000)} seconds before sending another message` 
        }, { status: 429 });
      }
    }

    // Create the message
    const { data: newMessage, error } = await supabase
      .from('chat_messages')
      .insert([{
        user_id: session.user_id,
        message: message.trim(),
        channel,
        created_at: new Date().toISOString()
      }])
      .select(`
        id,
        message,
        created_at,
        channel,
        users (
          id,
          displayname,
          vip_tier,
          level,
          role
        )
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          error: 'Chat system not yet available - database tables pending'
        }, { status: 503 });
      }
      console.error('Error creating message:', error);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('id');

    if (!messageId) {
      return NextResponse.json({ 
        error: 'Message ID is required' 
      }, { status: 400 });
    }

    // Check if user owns the message or is admin
    const { data: message, error: fetchError } = await supabase
      .from('chat_messages')
      .select('user_id')
      .eq('id', messageId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({
          error: 'Chat system not yet available'
        }, { status: 503 });
      }
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user_id)
      .single();

    const isOwner = message.user_id === session.user_id;
    const isAdmin = userData?.role === 'admin' || userData?.role === 'moderator';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ 
        error: 'You can only delete your own messages' 
      }, { status: 403 });
    }

    // Delete the message
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Error deleting message:', error);
      return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
