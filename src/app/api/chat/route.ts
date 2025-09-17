import { NextResponse } from 'next/server';
import { getDb, getAll, run, getOne, runAndGetId } from '@/lib/db';
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
    const db = await getDb();
    
    // Get recent chat messages
    let query = `
      SELECT m.id, m.message as content, m.created_at, m.user_id,
             u.displayName as username, u.avatar_url as avatar, u.level, u.role
      FROM chat_messages m
      JOIN users u ON m.user_id = u.id
    `;
    
    const params: (string | number)[] = [];
    
    if (before) {
      query += ' WHERE m.created_at < ?';
      params.push(before);
    }
    
    query += ' ORDER BY m.created_at DESC LIMIT ?';
    params.push(limit);
    
    const messages = await getAll<ChatMessage>(query, params);
    
    // If no messages found, return mock messages
    if (messages.length === 0) {
      const mockMessages = [
        {
          id: '1',
          content: 'Welcome to the chat! 🎉',
          username: 'Admin',
          avatar: 'https://picsum.photos/40/40?random=1',
          level: 100,
          role: 'admin',
          timestamp: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
        },
        {
          id: '2',
          content: 'Just won a big bet! 💰',
          username: 'LuckyPlayer',
          avatar: 'https://picsum.photos/40/40?random=2',
          level: 45,
          role: 'user',
          timestamp: new Date(Date.now() - 240000).toISOString() // 4 minutes ago
        },
        {
          id: '3',
          content: 'Anyone know when the next tournament starts?',
          username: 'GameFan2024',
          avatar: 'https://picsum.photos/40/40?random=3',
          level: 23,
          role: 'user',
          timestamp: new Date(Date.now() - 180000).toISOString() // 3 minutes ago
        },
        {
          id: '4',
          content: 'Good luck everyone! 🍀',
          username: 'BettingPro',
          avatar: 'https://picsum.photos/40/40?random=4',
          level: 67,
          role: 'moderator',
          timestamp: new Date(Date.now() - 120000).toISOString() // 2 minutes ago
        },
        {
          id: '5',
          content: 'The new update looks amazing!',
          username: 'TechEnthusiast',
          avatar: 'https://picsum.photos/40/40?random=5',
          level: 34,
          role: 'user',
          timestamp: new Date(Date.now() - 60000).toISOString() // 1 minute ago
        }
      ];
      
      return NextResponse.json({ messages: mockMessages.reverse() });
    }
    
    // Reverse to show oldest first
    return NextResponse.json({ messages: messages.reverse() });
    
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
    const session = await getOne<{ user_id: string }>(
      'SELECT user_id FROM sessions WHERE token = ?',
      [sessionToken]
    );
    
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }
    
    // Get user details
    const user = await getOne<{ displayName: string; role: string }>(
      'SELECT displayName, role FROM users WHERE id = ?',
      [session.user_id]
    );
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Insert new chat message with sanitized content
    const messageId = uuidv4();
    await run(
      `INSERT INTO chat_messages 
       (id, content, message, user_id, username, created_at) 
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [messageId, sanitizedContent, sanitizedContent, session.user_id, user.displayName]
    );
    
    // Get the created message with user info
    const newMessage = await getOne<ChatMessage>(
      `SELECT m.id, m.content, m.created_at, m.user_id,
              u.displayName as username, u.avatar_url as avatar, u.level, u.role
       FROM chat_messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.id = ?`,
      [messageId]
    );
    
    return NextResponse.json({ 
      success: true, 
      message: newMessage || {
        id: messageId,
        content: content.trim(),
        username: user.displayName,
        avatar: 'https://picsum.photos/40/40?random=7',
        level: 1,
        role: user.role, // Use the actual user role, not hardcoded 'user'
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error sending chat message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}