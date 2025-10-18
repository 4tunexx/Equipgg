import { NextRequest, NextResponse } from 'next/server';
import { supabase } from "../../../../../lib/supabase";

export async function GET(request: NextRequest, { params }: any) {
  try {
    const topicId = params.id;

    // Get the topic with first post
    const { data: topic, error: topicError } = await supabase
      .from('forum_topics')
      .select(`
        id,
        title,
        view_count,
        reply_count,
        reputation,
        is_pinned,
        is_locked,
        created_at,
        author:author_id (
          id,
          displayname,
          avatar_url,
          role,
          xp,
          level
        ),
        category:category_id (
          id,
          name
        )
      `)
      .eq('id', topicId)
      .single();

    if (topicError || !topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Get first post for this topic
    const { data: firstPost } = await supabase
      .from('forum_posts')
      .select('id, content, created_at')
      .eq('topic_id', topicId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    const transformedPost = {
      id: topic.id,
      title: topic.title,
      content: firstPost?.content || '',
      author: {
        id: topic.author?.id || '',
        displayName: topic.author?.displayname || 'Anonymous',
        avatarUrl: topic.author?.avatar_url,
        role: topic.author?.role || 'user',
        xp: topic.author?.xp || 0,
        level: topic.author?.level || 1
      },
      category: topic.category?.name || 'General',
      views: topic.view_count || 0,
      replies: topic.reply_count || 0,
      likes: topic.reputation || 0,
      createdAt: topic.created_at,
      updatedAt: topic.created_at,
      isPinned: topic.is_pinned || false,
      isLocked: topic.is_locked || false
    };

    return NextResponse.json({ post: transformedPost });

  } catch (error) {
    console.error('Error fetching forum post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forum post' },
      { status: 500 }
    );
  }
}