import { NextRequest, NextResponse } from 'next/server';
import { supabase } from "../../../../lib/supabase";
import { getAuthSession } from "../../../../lib/auth-utils";
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';
    const sort = searchParams.get('sort') || 'recent';
    const search = searchParams.get('search') || '';

    // Build Supabase query
    let query = supabase
      .from('forum_posts')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        reputation,
        topic:topic_id (
          id,
          title,
          is_pinned,
          is_locked,
          view_count,
          reply_count,
          category:category_id (
            id,
            name
          )
        ),
        author:author_id (
          id,
          displayname,
          avatar_url,
          role,
          xp,
          level
        )
      `)
      .eq('is_deleted', false);

    // Apply category filter
    if (category !== 'all') {
      query = query.eq('topic.category_id', category);
    }

    // Apply search filter
    if (search) {
      query = query.or(`content.ilike.%${search}%,topic.title.ilike.%${search}%`);
    }

    // Apply sorting
    switch (sort) {
      case 'recent':
        query = query.order('created_at', { ascending: false });
        break;
      case 'popular':
        query = query.order('reputation', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    query = query.limit(50);

    const { data: posts, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      // Return empty array if tables don't exist yet
      if (error.code === '42P01') {
        return NextResponse.json({ posts: [] });
      }
      throw error;
    }

    // Transform the data
    const transformedPosts = (posts || []).map((post: any) => ({
      id: post.id,
      title: post.topic?.title || 'Untitled',
      content: post.content,
      author: {
        id: post.author?.id || '',
        displayName: post.author?.displayname || 'Anonymous',
        avatarUrl: post.author?.avatar_url,
        role: post.author?.role || 'user',
        xp: post.author?.xp || 0,
        level: post.author?.level || 1
      },
      category: post.topic?.category?.name || 'General',
      views: post.topic?.view_count || 0,
      replies: post.topic?.reply_count || 0,
      likes: post.reputation || 0,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      isPinned: post.topic?.is_pinned || false,
      isLocked: post.topic?.is_locked || false
    }));

    return NextResponse.json({ posts: transformedPosts });

  } catch (error) {
    console.error('Error fetching forum posts:', error);
    return NextResponse.json({ posts: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topicId, content } = await request.json();

    if (!topicId || !content?.trim()) {
      return NextResponse.json(
        { error: 'Topic ID and content are required' },
        { status: 400 }
      );
    }

    // Verify topic exists
    const { data: topic, error: topicError } = await supabase
      .from('forum_topics')
      .select('*')
      .eq('id', topicId)
      .single();

    if (topicError || !topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Check if topic is locked
    if (topic.is_locked) {
      return NextResponse.json(
        { error: 'This topic is locked' },
        { status: 403 }
      );
    }

    const postId = uuidv4();
    const now = new Date().toISOString();

    // Create the post
    const { data: post, error: postError } = await supabase
      .from('forum_posts')
      .insert({
        id: postId,
        topic_id: topicId,
        author_id: session.user_id,
        content: content.trim(),
        reputation: 0,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (postError) {
      console.error('Error creating post:', postError);
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      );
    }

    // Update topic reply count and last activity
    await supabase
      .from('forum_topics')
      .update({
        reply_count: topic.reply_count + 1,
        last_activity_at: now
      })
      .eq('id', topicId);

    return NextResponse.json({
      success: true,
      post
    });

  } catch (error) {
    console.error('Error creating forum post:', error);
    return NextResponse.json(
      { error: 'Failed to create forum post' },
      { status: 500 }
    );
  }
}