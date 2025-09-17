import { NextResponse } from 'next/server';
import { getDb, getAll, run, runAndGetId } from '@/lib/db';

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  topic_count: number;
  post_count: number;
}

interface ForumTopic {
  id: string;
  title: string;
  author_name: string;
  category_name: string;
  created_at: string;
  reply_count: number;
}

export async function GET() {
  try {
    // Initialize database
    const db = await getDb();
    
    // Get forum categories and recent topics
    const categories = await getAll<ForumCategory>(
      `SELECT id, name, description, topic_count, post_count, icon 
       FROM forum_categories 
       ORDER BY display_order ASC`,
      []
    );
    
    const recentTopics = await getAll<ForumTopic>(
      `SELECT t.id, t.title, t.category_id, t.author_id, t.created_at, t.reply_count, t.view_count,
              u.displayName as username, u.avatar_url as avatar, u.role, c.name as category_name
       FROM forum_topics t
       JOIN users u ON t.author_id = u.id
       JOIN forum_categories c ON t.category_id = c.id
       ORDER BY t.created_at DESC
       LIMIT 10`,
      []
    );
    
    // If no data found, return mock data
    if (categories.length === 0) {
      const mockCategories = [
        {
          id: '1',
          name: 'General Discussion',
          description: 'General chat about anything and everything',
          topicCount: 156,
          postCount: 2341,
          icon: '💬'
        },
        {
          id: '2', 
          name: 'Game Strategy',
          description: 'Share your winning strategies and tips',
          topicCount: 89,
          postCount: 1567,
          icon: '🎯'
        },
        {
          id: '3',
          name: 'Technical Support',
          description: 'Get help with technical issues',
          topicCount: 45,
          postCount: 234,
          icon: '🔧'
        },
        {
          id: '4',
          name: 'Announcements',
          description: 'Official announcements and updates',
          topicCount: 12,
          postCount: 89,
          icon: '📢'
        }
      ];
      
      const mockRecentTopics = [
        {
          id: '1',
          title: 'Welcome to the new forum!',
          author: 'Admin',
          avatar: 'https://picsum.photos/40/40?random=11',
          category: 'Announcements',
          replies: 23,
          views: 156,
          lastActivity: '2 hours ago'
        },
        {
          id: '2',
          title: 'Best betting strategies for beginners',
          author: 'ProGamer123',
          avatar: 'https://picsum.photos/40/40?random=12',
          category: 'Game Strategy',
          replies: 45,
          views: 289,
          lastActivity: '4 hours ago'
        },
        {
          id: '3',
          title: 'Site maintenance scheduled for tomorrow',
          author: 'Moderator',
          avatar: 'https://picsum.photos/40/40?random=13',
          category: 'Announcements',
          replies: 8,
          views: 67,
          lastActivity: '6 hours ago'
        }
      ];
      
      return NextResponse.json({
        categories: mockCategories,
        recentTopics: mockRecentTopics
      });
    }
    
    return NextResponse.json({
      categories,
      recentTopics
    });
    
  } catch (error) {
    console.error('Error fetching forum data:', error);
    
    // Return fallback mock data on error
    const fallbackData = {
      categories: [
        {
          id: '1',
          name: 'General Discussion',
          description: 'General chat about anything and everything',
          topicCount: 156,
          postCount: 2341,
          icon: '💬'
        },
        {
          id: '2',
          name: 'Game Strategy', 
          description: 'Share your winning strategies and tips',
          topicCount: 89,
          postCount: 1567,
          icon: '🎯'
        }
      ],
      recentTopics: [
        {
          id: '1',
          title: 'Welcome to the forum!',
          author: 'Admin',
          avatar: 'https://picsum.photos/40/40?random=11',
          category: 'Announcements',
          replies: 23,
          views: 156,
          lastActivity: '2 hours ago'
        }
      ]
    };
    
    return NextResponse.json(fallbackData);
  }
}

export async function POST(request: Request) {
  try {
    const { title, content, categoryId } = await request.json();
    
    if (!title || !content || !categoryId) {
      return NextResponse.json(
        { error: 'Title, content, and category are required' },
        { status: 400 }
      );
    }
    
    // Initialize database
    const db = await getDb();
    
    // For demo purposes, use a mock user ID
    const mockUserId = 'user_123';
    
    // Create new forum topic
    const topicId = await runAndGetId(
      `INSERT INTO forum_topics 
       (title, content, category_id, author_id, created_at, reply_count, view_count) 
       VALUES (?, ?, ?, ?, datetime('now'), 0, 0)`,
      [title, content, categoryId, mockUserId]
    );
    
    return NextResponse.json({ 
      success: true, 
      topicId,
      message: 'Topic created successfully'
    });
    
  } catch (error) {
    console.error('Error creating forum topic:', error);
    return NextResponse.json(
      { error: 'Failed to create topic' },
      { status: 500 }
    );
  }
}