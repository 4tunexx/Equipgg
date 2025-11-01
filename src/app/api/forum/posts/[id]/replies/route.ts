import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../../lib/supabase';
import { getAuthSession } from '../../../../../../lib/auth-utils';
import { v4 as uuidv4 } from 'uuid';
import { checkBalanceAccess, createVerificationNotification } from '../../../../../../lib/verification-check';

export async function GET(request: NextRequest, { params }: any) {
  try {
    const topicId = params.id;

    // Get all posts for this topic (excluding first post)
    const { data: posts, error } = await supabase
      .from('forum_posts')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        edited_at,
        reputation,
        author:author_id (
          id,
          displayname,
          avatar_url,
          role,
          xp,
          level
        )
      `)
      .eq('topic_id', topicId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching forum replies:', error);
      return NextResponse.json({ replies: [] });
    }

    // Skip first post (it's the main post), rest are replies
    const replies = (posts || []).slice(1);

    const transformedReplies = replies.map((reply: any) => ({
      id: reply.id,
      content: reply.content,
      createdAt: reply.created_at,
      updatedAt: reply.updated_at,
      editedAt: reply.edited_at,
      author: {
        id: reply.author?.id || '',
        displayName: reply.author?.displayname || 'Anonymous',
        avatarUrl: reply.author?.avatar_url,
        role: reply.author?.role || 'user',
        xp: reply.author?.xp || 0,
        level: reply.author?.level || 1
      },
      likes: reply.reputation || 0
    }));

    return NextResponse.json({ replies: transformedReplies });

  } catch (error) {
    console.error('Error fetching forum replies:', error);
    return NextResponse.json({ replies: [] });
  }
}

export async function POST(request: NextRequest, { params }: any) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check verification status - users must verify email or Steam to reply
    const verificationStatus = await checkBalanceAccess(session.user_id);
    if (!verificationStatus.canUseBalances) {
      console.error('❌ Forum reply blocked - Verification failed:', {
        userId: session.user_id,
        verificationStatus
      });
      
      // Create notification for user
      const notificationType = verificationStatus.requiresEmailVerification ? 'email' : 'steam';
      await createVerificationNotification(session.user_id, notificationType);
      
      return NextResponse.json({ 
        error: verificationStatus.message || 'Account verification required to reply',
        requiresVerification: true,
        notificationCreated: true,
        details: {
          requiresEmailVerification: verificationStatus.requiresEmailVerification,
          requiresSteamVerification: verificationStatus.requiresSteamVerification
        }
      }, { status: 403 });
    }

    const topicId = params.id;
    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Reply content is required' },
        { status: 400 }
      );
    }

    // Get topic to check if locked
    const { data: topic } = await supabase
      .from('forum_topics')
      .select('is_locked, reply_count')
      .eq('id', topicId)
      .single();

    if (topic?.is_locked) {
      return NextResponse.json(
        { error: 'This topic is locked' },
        { status: 403 }
      );
    }

    const postId = uuidv4();
    const now = new Date().toISOString();

    // Create reply post
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
      console.error('Error creating reply:', postError);
      return NextResponse.json(
        { error: 'Failed to create reply' },
        { status: 500 }
      );
    }

    // Update topic reply count
    await supabase
      .from('forum_topics')
      .update({
        reply_count: (topic?.reply_count || 0) + 1,
        last_activity_at: now
      })
      .eq('id', topicId);

    return NextResponse.json({
      success: true,
      message: 'Reply created successfully'
    });

  } catch (error) {
    console.error('Error creating forum reply:', error);
    return NextResponse.json(
      { error: 'Failed to create forum reply' },
      { status: 500 }
    );
  }
}