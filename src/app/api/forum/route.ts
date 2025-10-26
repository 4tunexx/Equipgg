import { NextRequest, NextResponse } from 'next/server';
import { supabase } from "../../../lib/supabase";
import { getAuthSession } from "../../../lib/auth-utils";
import { v4 as uuidv4 } from 'uuid';

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
    const { data: categories, error: catError } = await supabase
      .from('forum_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (catError) {
      console.error('Error fetching categories:', catError);
      return NextResponse.json({ categories: [], recentTopics: [] });
    }

    // Get recent topics with author info
    const { data: topics, error: topicsError } = await supabase
      .from('forum_topics')
      .select(`
        id,
        title,
        category_id,
        reply_count,
        reputation,
        view_count,
        created_at,
        author:author_id(id, displayname, avatar_url),
        category:category_id(name)
      `)
      .order('last_activity_at', { ascending: false })
      .limit(10);

    if (topicsError) {
      console.error('Error fetching topics:', topicsError);
    }

    const recentTopics = (topics || []).map((topic: any) => ({
      id: topic.id,
      title: topic.title,
      category: topic.category?.name || 'General',
      author: {
        id: topic.author?.id || '',
        displayName: topic.author?.displayname || 'Anonymous',
        avatarUrl: topic.author?.avatar_url
      },
      replies: topic.reply_count || 0,
      rep: topic.reputation || 0,
      views: topic.view_count || 0,
      lastActivity: topic.created_at
    }));
    
    return NextResponse.json({
      categories: categories || [],
      recentTopics
    });
    
  } catch (error) {
    console.error('Error fetching forum data:', error);
    return NextResponse.json({ categories: [], recentTopics: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, content, categoryId } = await request.json();
    
    if (!title || !content || !categoryId) {
      return NextResponse.json(
        { error: 'Title, content, and category are required' },
        { status: 400 }
      );
    }

    // Check if category exists
    const { data: category, error: catError } = await supabase
      .from('forum_categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (catError || !category) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }
    
    const topicId = uuidv4();
    const postId = uuidv4();
    const now = new Date().toISOString();

    // Create new forum topic
    const { data: topic, error: topicError } = await supabase
      .from('forum_topics')
      .insert({
        id: topicId,
        title: title.trim(),
        category_id: categoryId,
        author_id: session.user_id,
        reply_count: 0,
        view_count: 0,
        reputation: 0,
        created_at: now,
        updated_at: now,
        last_activity_at: now
      })
      .select()
      .single();

    if (topicError) {
      console.error('Error creating topic:', topicError);
      return NextResponse.json(
        { error: 'Failed to create topic' },
        { status: 500 }
      );
    }

    // Create first post in the topic
    const { error: postError } = await supabase
      .from('forum_posts')
      .insert({
        id: postId,
        topic_id: topicId,
        author_id: session.user_id,
        content: content.trim(),
        reputation: 0,
        created_at: now,
        updated_at: now
      });

    if (postError) {
      console.error('Error creating post:', postError);
      // Rollback topic creation
      await supabase.from('forum_topics').delete().eq('id', topicId);
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      );
    }

    // Update category topic count
    await supabase
      .from('forum_categories')
      .update({ 
        topic_count: (category.topic_count || 0) + 1,
        post_count: (category.post_count || 0) + 1
      })
      .eq('id', categoryId);

    return NextResponse.json({
      success: true,
      topicId: topic.id,
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