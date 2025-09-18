import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
    // Get forum categories from Supabase
    const { data: categories, error: categoriesError } = await supabase
      .from('forum_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (categoriesError) {
      console.error('Error fetching forum categories:', categoriesError);
      return NextResponse.json({ error: 'Failed to fetch forum categories' }, { status: 500 });
    }

    // Get recent topics from Supabase
    const { data: recentTopics, error: topicsError } = await supabase
      .from('forum_topics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (topicsError) {
      console.error('Error fetching forum topics:', topicsError);
      return NextResponse.json({ error: 'Failed to fetch forum topics' }, { status: 500 });
    }
    
    return NextResponse.json({
      categories: categories || [],
      recentTopics: recentTopics || []
    });
    
  } catch (error) {
    console.error('Error fetching forum data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    
    // Get user session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Create new forum topic in Supabase
    const { data: topic, error: createError } = await supabase
      .from('forum_topics')
      .insert([{
        title,
        content,
        category_id: categoryId,
        author_id: userId,
        reply_count: 0,
        view_count: 0
      }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating forum topic:', createError);
      return NextResponse.json(
        { error: 'Failed to create topic' },
        { status: 500 }
      );
    }
    
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