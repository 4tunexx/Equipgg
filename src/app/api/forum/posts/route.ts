import { NextResponse } from 'next/server';
import { secureDb } from "../../../../lib/secure-db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';
    const sort = searchParams.get('sort') || 'recent';
    const search = searchParams.get('search') || '';

    // Build the query to join forum_posts with users table
    let query = `
      SELECT 
        fp.id,
        fp.content,
        fp.created_at,
        fp.updated_at,
        fp.topic_id,
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
    `;

    const conditions: string[] = [];
    
    if (category !== 'all') {
      conditions.push(`fc.id = '${category}'`);
    }
    
    if (search) {
      conditions.push(`(ft.title ILIKE '%${search}%' OR fp.content ILIKE '%${search}%')`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Add sorting
    switch (sort) {
      case 'recent':
        query += ' ORDER BY fp.created_at DESC';
        break;
      case 'popular':
        query += ' ORDER BY ft.reply_count DESC, ft.view_count DESC';
        break;
      case 'likes':
        // This would require a join with forum_post_reactions table
        query += ' ORDER BY fp.created_at DESC'; // Fallback for now
        break;
      default:
        query += ' ORDER BY fp.created_at DESC';
    }

    query += ' LIMIT 50';

    const posts = await secureDb.rawQuery(query);

    // Transform the data to match the expected interface
    const transformedPosts = posts.map((post: any) => ({
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
    }));

    return NextResponse.json({ posts: transformedPosts });

  } catch (error) {
    console.error('Error fetching forum posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forum posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { title, content, category } = await request.json();

    if (!title?.trim() || !content?.trim() || !category) {
      return NextResponse.json(
        { error: 'Title, content, and category are required' },
        { status: 400 }
      );
    }

    // For now, we'll return a success message
    // In a real implementation, you would:
    // 1. Create a forum_topic entry
    // 2. Create a forum_post entry as the first post in the topic
    // 3. Return the created post data

    return NextResponse.json({
      success: true,
      message: 'Forum post created successfully (API placeholder)'
    });

  } catch (error) {
    console.error('Error creating forum post:', error);
    return NextResponse.json(
      { error: 'Failed to create forum post' },
      { status: 500 }
    );
  }
}