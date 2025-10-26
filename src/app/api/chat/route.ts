import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-utils';
import { createServerSupabaseClient } from '@/lib/supabase';

// Simple chat API that works with existing database
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    const { searchParams } = new URL(request.url);
    // Support both 'channel' and 'lobby' parameter names
    const channel = searchParams.get('channel') || searchParams.get('lobby') || 'dashboard';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Try to get messages from chat_messages table
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select(`
        id,
        content,
        sender_id,
        channel_id,
        created_at,
        sender:sender_id(id, displayname, avatar_url, role, level)
      `)
      .eq('channel_id', channel)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === 'PGRST116') {
        return NextResponse.json({ 
          success: true, 
          messages: [],
          note: 'Chat system initializing...'
        });
      }
      console.error('Chat messages error:', error);
      return NextResponse.json({ success: true, messages: [] });
    }

    // Transform messages to match frontend format
    const formattedMessages = (messages || []).reverse().map((msg: any) => ({
      id: msg.id,
      rank: msg.sender?.level || 1,
      username: msg.sender?.displayname || 'Anonymous',
      avatar: msg.sender?.avatar_url || null,
      role: msg.sender?.role || 'user',
      content: msg.content,
      timestamp: msg.created_at,
      level: msg.sender?.level || 0,
    }));

    return NextResponse.json({
      success: true,
      messages: formattedMessages
    });

  } catch (error) {
    console.error('Get chat messages error:', error);
    return NextResponse.json({ 
      success: true, 
      messages: [],
      error: 'Chat temporarily unavailable'
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Please log in to chat' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    const { content, lobby = 'dashboard' } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ 
        error: 'Message content is required' 
      }, { status: 400 });
    }

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('displayname, avatar_url, role, level')
      .eq('id', session.user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Try to save message to database
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { data: newMessage, error: messageError } = await supabase
      .from('chat_messages')
      .insert({
        id: messageId,
        sender_id: session.user_id,
        channel_id: lobby,
        content: content.trim(),
        type: 'text',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (messageError) {
      // If table doesn't exist, still return success for now
      if (messageError.code === 'PGRST116') {
        console.log('Chat messages table not found - using fallback');
        return NextResponse.json({
          success: true,
          message: {
            id: messageId,
            content: content.trim(),
            username: user.displayname || 'Player',
            avatar: user.avatar_url,
            role: user.role || 'user',
            level: user.level || 1,
            timestamp: new Date().toISOString()
          },
          note: 'Chat system initializing - message not saved yet'
        });
      }
      
      console.error('Failed to save message:', messageError);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: {
        id: newMessage.id,
        content: newMessage.content,
        username: user.displayname || 'Player',
        avatar: user.avatar_url,
        role: user.role || 'user',
        level: user.level || 1,
        timestamp: newMessage.created_at,
        rank: user.level || 1
      }
    });

  } catch (error) {
    console.error('Send chat message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}