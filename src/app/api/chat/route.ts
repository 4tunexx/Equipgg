import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface ChatMessage {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  username: string;
  avatar: string | null;
  level: number;
  role?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // For pagination
    
    // Get recent chat messages from Supabase with user info
    let query = supabase
      .from('chat_messages')
      .select(`
        *,
        user:users(id, username, avatar_url, level, role)
      `);
    
    if (before) {
      query = query.lt('created_at', before);
    }
    
    query = query.order('created_at', { ascending: false }).limit(limit);
    
    const { data: messages, error } = await query;
    
    if (error) {
      console.error('Error fetching chat messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
    
    // Transform messages to include user info
    const transformedMessages = (messages || []).map((msg: any) => ({
      id: msg.id,
      content: msg.content,
      created_at: msg.created_at,
      user_id: msg.user_id,
      username: msg.user?.username || 'Unknown',
      avatar: msg.user?.avatar_url || null,
      level: msg.user?.level || 1,
      role: msg.user?.role || 'user'
    }));
    
    return NextResponse.json({ messages: transformedMessages.reverse() });
    
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { content } = await request.json();
    
    // Input validation and sanitization
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }
    
    // Sanitize input to prevent XSS
    const sanitizedContent = content
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
    
    if (sanitizedContent.length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }
    
    if (sanitizedContent.length > 500) {
      return NextResponse.json(
        { error: 'Message too long (max 500 characters)' },
        { status: 400 }
      );
    }
    
    // Get the current user session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Get user details from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('username, avatar_url, level, role')
      .eq('id', userId)
      .single();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Insert new chat message in Supabase
    const { data: newMessage, error: insertError } = await supabase
      .from('chat_messages')
      .insert([{
        content: sanitizedContent,
        user_id: userId,
      }])
      .select()
      .single();
    
    if (insertError) {
      console.error('Error inserting chat message:', insertError);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }
    
    // Return the created message with user info
    const responseMessage = {
      id: newMessage.id,
      content: newMessage.content,
      created_at: newMessage.created_at,
      user_id: userId,
      username: user.username,
      avatar: user.avatar_url || null,
      level: user.level || 1,
      role: user.role || 'user',
    };
    
    return NextResponse.json({ 
      success: true, 
      message: responseMessage
    });
    
  } catch (error) {
    console.error('Error sending chat message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}