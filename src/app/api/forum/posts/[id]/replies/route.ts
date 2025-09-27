import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../../../lib/supabase';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const postId = params.id;
    const supabase = createServerSupabaseClient();

    // Fetch forum replies with user data
    const { data: replies, error } = await supabase
      .from('forum_replies')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        is_edited,
        edited_at,
        author_id,
        users (
          id,
          username,
          avatar_url,
          role,
          xp,
          level
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching forum replies:', error);
      return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 });
    }

    // Transform the data to match the expected interface
    const transformedReplies = replies.map((reply) => ({
      id: reply.id,
      content: reply.content,
      createdAt: reply.created_at,
      updatedAt: reply.updated_at,
      isEdited: reply.is_edited,
      editedAt: reply.edited_at,
      author: {
        id: (reply.users as any[])[0]?.id,
        displayName: (reply.users as any[])[0]?.username,
        avatarUrl: (reply.users as any[])[0]?.avatar_url,
        role: (reply.users as any[])[0]?.role,
        xp: (reply.users as any[])[0]?.xp,
        level: (reply.users as any[])[0]?.level
      },
      likes: [] // Placeholder for likes data
    }));

    return NextResponse.json({ replies: transformedReplies });

  } catch (error) {
    console.error('Error fetching forum replies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forum replies' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const postId = params.id;
    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Reply content is required' },
        { status: 400 }
      );
    }

    // For now, return a success message
    // In a real implementation, you would:
    // 1. Create a forum_reply entry
    // 2. Update the forum_topics reply_count
    // 3. Return the created reply data

    return NextResponse.json({
      success: true,
      message: 'Forum reply created successfully (API placeholder)'
    });

  } catch (error) {
    console.error('Error creating forum reply:', error);
    return NextResponse.json(
      { error: 'Failed to create forum reply' },
      { status: 500 }
    );
  }
}