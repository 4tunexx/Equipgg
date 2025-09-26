import { NextResponse } from 'next/server';
import { secureDb } from "../../../../../lib/secure-db";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const postId = params.id;

    const query = `
      SELECT 
        fp.id,
        fp.content,
        fp.created_at,
        fp.updated_at,
        fp.is_edited,
        fp.edited_at,
        ft.title,
        ft.is_pinned,
        ft.is_locked,
        ft.view_count,
        ft.reply_count,
        ft.last_reply_at,
        fc.id as category_id,
        fc.name as category_name,
        u.id as author_id,
        u.username as author_displayName,
        u.avatar_url as author_avatarUrl,
        u.role as author_role,
        u.xp as author_xp,
        u.level as author_level
      FROM forum_posts fp
      INNER JOIN forum_topics ft ON fp.topic_id = ft.id
      INNER JOIN forum_categories fc ON ft.category_id = fc.id
      INNER JOIN users u ON fp.author_id = u.id
      WHERE fp.id = $1
      LIMIT 1
    `;

    const posts = await secureDb.rawQuery(query, [postId]);

    if (posts.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const post = posts[0];

    // Transform the data to match the expected interface
    const transformedPost = {
      id: post.id,
      title: post.title,
      content: post.content,
      author: {
        id: post.author_id,
        displayName: post.author_displayName,
        avatarUrl: post.author_avatarUrl,
        role: post.author_role,
        xp: post.author_xp,
        level: post.author_level
      },
      category: post.category_name,
      views: post.view_count || 0,
      replies: post.reply_count || 0,
      likes: 0, // Would need to join with forum_post_reactions
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      lastReplyAt: post.last_reply_at,
      isPinned: post.is_pinned,
      isLocked: post.is_locked
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