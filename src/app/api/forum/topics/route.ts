import { NextRequest, NextResponse } from 'next/server';
import { supabase } from "../../../../lib/supabase";
import { getAuthSession } from "../../../../lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
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
        last_activity_at,
        author:author_id (
          id,
          displayname,
          avatar_url,
          role
        ),
        category:category_id (
          id,
          name
        )
      `)
      .order('is_pinned', { ascending: false })
      .order('last_activity_at', { ascending: false })
      .limit(limit);

    if (categoryId && categoryId !== 'all') {
      query = query.eq('category_id', categoryId);
    }

    const { data: topics, error } = await query;

    if (error) {
      console.error('Error fetching topics:', error);
      // Return empty array if tables don't exist
      if (error.code === '42P01' || error.code === '42703') {
        return NextResponse.json({ success: true, topics: [] });
      }
      return NextResponse.json({ success: true, topics: [] });
    }

    return NextResponse.json({
      success: true,
      topics: topics || []
    });

  } catch (error) {
    console.error('Error in topics GET:', error);
    return NextResponse.json({ success: true, topics: [] });
  }
}
