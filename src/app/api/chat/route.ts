import { NextRequest, NextResponse } from 'next/server';
import { supabase } from "../../../lib/supabase";
import { secureDb } from "../../../lib/secure-db";
import { getAuthSession } from "../../../lib/auth-utils";
import { v4 as uuidv4 } from 'uuid';

interface ChatMessage {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  username: string;
  avatar: string | null;
  level: number;
  rank: string;
  role?: string;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication - allow both authenticated and unauthenticated requests
    const session = await getAuthSession(request);
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // For pagination
    const lobby = searchParams.get('lobby') || 'dashboard';
    
    // Get recent chat messages from Supabase with user data joined
    let query = supabase
      .from('chat_messages')
      .select(`
        id,
        content,
        created_at,
        user_id,
        lobby,
        users!inner (
          id,
          username,
          displayname,
          avatar_url,
          level,
          role,
          steam_verified
        )
      `)
      .eq('lobby', lobby);
      
    if (before) {
      query = query.lt('created_at', before);
    }
    
    query = query.order('created_at', { ascending: false }).limit(limit);
    
    const { data: messages, error } = await query;
    
    if (error) {
      console.error('Error fetching chat messages:', error);
      
      // Return empty chat instead of mock data to encourage real usage
      return NextResponse.json({ 
        messages: [],
        error: 'Chat is temporarily unavailable'
      });
    }
    
    if (!messages || messages.length === 0) {
      // Return empty chat if no messages exist yet
      return NextResponse.json({ messages: [] });
    }
    
    // Format the messages with user data
    const formattedMessages = messages.map((m: any) => {
      const user = m.users;
      return {
        id: m.id,
        content: m.content,
        created_at: m.created_at,
        user_id: m.user_id,
        username: user.displayname || user.username || 'Anonymous',
        avatar: user.avatar_url || null,
        level: user.level || 1,
        role: user.role || 'user',
        rank: user.role || 'user',
        timestamp: m.created_at
      };
    });

    return NextResponse.json({ messages: formattedMessages.reverse() });
    
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    
    // Return empty chat on error to encourage fixing the issue
    return NextResponse.json({ 
      messages: [],
      error: 'Chat is temporarily unavailable. Please try again later.'
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication - require authenticated user for posting
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { content, lobby } = await request.json();
    
    // SECURITY: Input validation and sanitization
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
    
    // SECURITY: Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // Simple rate limiting (in production, use Redis or similar)
    const rateLimitKey = `chat_${clientIP}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 10; // 10 messages per minute
    
    // This is a simplified rate limiting - in production use proper rate limiting
    // For now, we'll just log the attempt
    console.log(`Chat message attempt from IP: ${clientIP}`);
    
    // Get user details from session
    const user = await secureDb.findOne('users', { id: session.user_id });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    // Insert new chat message with sanitized content
    const messageId = uuidv4();
    await secureDb.create('chat_messages', {
      id: messageId,
      content: sanitizedContent,
      user_id: session.user_id,
      username: user.displayname || user.username || 'Player',
      created_at: new Date().toISOString(),
      lobby: lobby || 'dashboard',
    });
    // Compose the created message with user info
    const newMessage = {
      id: messageId,
      content: sanitizedContent,
      created_at: new Date().toISOString(),
      user_id: session.user_id,
      username: user.displayname || user.username || 'Player',
      avatar: user.avatar_url || null,
      level: user.level || 1,
      role: user.role || 'user',
    };
    return NextResponse.json({ 
      success: true, 
      message: newMessage
    });
    
  } catch (error) {
    console.error('Error sending chat message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}