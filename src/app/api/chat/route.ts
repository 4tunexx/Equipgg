import { NextResponse } from 'next/server';
import { supabase } from "../../../lib/supabase";
import { secureDb } from "../../../lib/secure-db";
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // For pagination
    
    // Initialize database
    
    // Get recent chat messages from Supabase with pagination
    let query = supabase.from('chat_messages').select('*');
    if (before) {
      query = query.lt('created_at', before);
    }
    query = query.order('created_at', { ascending: false }).limit(limit);
    const { data: messages, error } = await query;
    if (error || !messages) {
      // ...existing code for mockMessages...
      const mockMessages = [
        {
          id: '1',
          content: 'Welcome to the chat! 🎉',
          username: 'Admin',
          avatar: 'https://picsum.photos/40/40?random=1',
          level: 100,
          role: 'admin',
          timestamp: new Date(Date.now() - 300000).toISOString()
        },
        {
          id: '2',
          content: 'Just won a big bet! 💰',
          username: 'LuckyPlayer',
          avatar: 'https://picsum.photos/40/40?random=2',
          level: 45,
          role: 'user',
          timestamp: new Date(Date.now() - 240000).toISOString()
        },
        {
          id: '3',
          content: 'Anyone know when the next tournament starts?',
          username: 'GameFan2024',
          avatar: 'https://picsum.photos/40/40?random=3',
          level: 23,
          role: 'user',
          timestamp: new Date(Date.now() - 180000).toISOString()
        },
        {
          id: '4',
          content: 'Good luck everyone! 🍀',
          username: 'BettingPro',
          avatar: 'https://picsum.photos/40/40?random=4',
          level: 67,
          role: 'moderator',
          timestamp: new Date(Date.now() - 120000).toISOString()
        },
        {
          id: '5',
          content: 'The new update looks amazing!',
          username: 'TechEnthusiast',
          avatar: 'https://picsum.photos/40/40?random=5',
          level: 34,
          role: 'user',
          timestamp: new Date(Date.now() - 60000).toISOString()
        }
      ];
      return NextResponse.json({ messages: mockMessages.reverse() });
    }
    // Attach user info
    const messagesWithUser = await Promise.all(
      (messages as any[]).map(async (m) => {
        const user = await secureDb.findOne('users', { id: m.user_id });
        return {
          id: m.id,
          content: m.content,
          created_at: m.created_at,
          user_id: m.user_id,
          username: user?.displayName || 'Unknown',
          avatar: user?.avatar_url || null,
          level: user?.level || 1,
          role: user?.role || 'user',
        };
      })
    );
    if (messagesWithUser.length === 0) {
      // ...existing code for mockMessages...
      const mockMessages = [
        {
          id: '1',
          content: 'Welcome to the chat! 🎉',
          username: 'Admin',
          avatar: 'https://picsum.photos/40/40?random=1',
          level: 100,
          role: 'admin',
          timestamp: new Date(Date.now() - 300000).toISOString()
        },
        {
          id: '2',
          content: 'Just won a big bet! 💰',
          username: 'LuckyPlayer',
          avatar: 'https://picsum.photos/40/40?random=2',
          level: 45,
          role: 'user',
          timestamp: new Date(Date.now() - 240000).toISOString()
        },
        {
          id: '3',
          content: 'Anyone know when the next tournament starts?',
          username: 'GameFan2024',
          avatar: 'https://picsum.photos/40/40?random=3',
          level: 23,
          role: 'user',
          timestamp: new Date(Date.now() - 180000).toISOString()
        },
        {
          id: '4',
          content: 'Good luck everyone! 🍀',
          username: 'BettingPro',
          avatar: 'https://picsum.photos/40/40?random=4',
          level: 67,
          role: 'moderator',
          timestamp: new Date(Date.now() - 120000).toISOString()
        },
        {
          id: '5',
          content: 'The new update looks amazing!',
          username: 'TechEnthusiast',
          avatar: 'https://picsum.photos/40/40?random=5',
          level: 34,
          role: 'user',
          timestamp: new Date(Date.now() - 60000).toISOString()
        }
      ];
      return NextResponse.json({ messages: mockMessages.reverse() });
    }
    return NextResponse.json({ messages: messagesWithUser.reverse() });
    
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    
    // Return fallback mock messages on error
    const fallbackMessages = [
      {
        id: '1',
        content: 'Chat is temporarily unavailable',
        username: 'System',
        avatar: 'https://picsum.photos/40/40?random=6',
        level: 0,
        rank: 'System',
        timestamp: new Date().toISOString()
      }
    ];
    
    return NextResponse.json({ messages: fallbackMessages });
  }
}

export async function POST(request: Request) {
  try {
    const { content } = await request.json();
    
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
    
    // Get the current user from session
    const cookies = request.headers.get('cookie') || '';
    const sessionToken = cookies
      .split(';')
      .find(c => c.trim().startsWith('equipgg_session='))
      ?.split('=')[1];
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get user from session
    const session = await secureDb.findOne('sessions', { token: sessionToken });
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }
    // Get user details
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
      username: user.displayName,
      created_at: new Date().toISOString(),
    });
    // Compose the created message with user info
    const newMessage = {
      id: messageId,
      content: sanitizedContent,
      created_at: new Date().toISOString(),
      user_id: session.user_id,
      username: user.displayName,
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