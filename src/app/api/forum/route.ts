import { NextResponse } from 'next/server';
import { secureDb } from "../../../lib/secure-db";

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
    // Get forum categories
    const categories = await secureDb.findMany<ForumCategory>('forum_categories', {}, { orderBy: 'display_order ASC' });
    // Get recent topics (no join, so just get latest topics)
    const recentTopics = await secureDb.findMany<ForumTopic>('forum_topics', {}, { orderBy: 'created_at DESC', limit: 10 });
    
    // If no data found, return empty lists; UI will render an empty state
    if (categories.length === 0) {
      return NextResponse.json({ categories: [], recentTopics: [] });
    }
    
    return NextResponse.json({
      categories,
      recentTopics
    });
    
  } catch (error) {
    console.error('Error fetching forum data:', error);
    
    // On error, return empty lists so the frontend shows an empty state and admin can seed data
    return NextResponse.json({ categories: [], recentTopics: [] });
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
    
  // No DB init needed
    
    // For demo purposes, use a mock user ID
    const mockUserId = 'user_123';
    
    // Create new forum topic
    const topic = await secureDb.create('forum_topics', {
      title,
      content,
      category_id: categoryId,
      author_id: mockUserId,
      created_at: new Date().toISOString(),
      reply_count: 0,
      view_count: 0
    });
    return NextResponse.json({
      success: true,
      topicId: topic?.id,
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