import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from "../../../../lib/auth-utils";
import { supabase } from "../../../../lib/supabase";
import { v4 as uuidv4 } from 'uuid';

// Get available chat channels
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: channels, error } = await supabase
      .from('chat_channels')
      .select(`
        *,
        last_message:chat_messages!fk_chat_messages_channel_id(content, created_at, sender:users!fk_chat_messages_sender_id(display_name))
      `)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
    }

    // Get unread counts for each channel
    const channelsWithUnread = await Promise.all(
      (channels || []).map(async (channel: any) => {
        // Get user's last read timestamp for this channel
        const { data: lastRead } = await supabase
          .from('chat_user_read_status')
          .select('last_read_at')
          .eq('user_id', session.user_id)
          .eq('channel_id', channel.id)
          .single();

        // Count unread messages
        let unreadQuery = supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('channel_id', channel.id)
          .neq('sender_id', session.user_id); // Don't count own messages

        if (lastRead?.last_read_at) {
          unreadQuery = unreadQuery.gt('created_at', lastRead.last_read_at);
        }

        const { count: unreadCount } = await unreadQuery;

        return {
          ...channel,
          unreadCount: unreadCount || 0,
          lastMessage: channel.last_message?.[0] || null
        };
      })
    );

    return NextResponse.json({
      success: true,
      channels: channelsWithUnread
    });

  } catch (error) {
    console.error('Get chat channels error:', error);
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
  }
}

// Create a new channel (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user_id)
      .single();

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { name, description, type = 'public', orderIndex } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Channel name is required' }, { status: 400 });
    }

    // Check if channel name already exists
    const { data: existingChannel } = await supabase
      .from('chat_channels')
      .select('id')
      .eq('name', name.trim())
      .single();

    if (existingChannel) {
      return NextResponse.json({ error: 'Channel name already exists' }, { status: 400 });
    }

    const channelId = uuidv4();
    const { data: channel, error: createError } = await supabase
      .from('chat_channels')
      .insert({
        id: channelId,
        name: name.trim(),
        description: description?.trim() || '',
        type,
        order_index: orderIndex || 999,
        created_by: session.user_id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create channel:', createError);
      return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Channel created successfully',
      channel
    });

  } catch (error) {
    console.error('Create chat channel error:', error);
    return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 });
  }
}

// Update channel (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user_id)
      .single();

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { channelId, name, description, type, orderIndex, isActive } = await request.json();

    if (!channelId) {
      return NextResponse.json({ error: 'Channel ID is required' }, { status: 400 });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (type !== undefined) updates.type = type;
    if (orderIndex !== undefined) updates.order_index = orderIndex;
    if (isActive !== undefined) updates.is_active = isActive;

    const { error: updateError } = await supabase
      .from('chat_channels')
      .update(updates)
      .eq('id', channelId);

    if (updateError) {
      console.error('Failed to update channel:', updateError);
      return NextResponse.json({ error: 'Failed to update channel' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Channel updated successfully'
    });

  } catch (error) {
    console.error('Update chat channel error:', error);
    return NextResponse.json({ error: 'Failed to update channel' }, { status: 500 });
  }
}

// Delete channel (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user_id)
      .single();

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');

    if (!channelId) {
      return NextResponse.json({ error: 'Channel ID is required' }, { status: 400 });
    }

    // Don't allow deleting default channels
    const defaultChannels = ['general', 'trading', 'support'];
    if (defaultChannels.includes(channelId)) {
      return NextResponse.json({ 
        error: 'Cannot delete default channels' 
      }, { status: 400 });
    }

    // Soft delete - mark as inactive
    const { error: deleteError } = await supabase
      .from('chat_channels')
      .update({ 
        is_active: false,
        deleted_at: new Date().toISOString(),
        deleted_by: session.user_id
      })
      .eq('id', channelId);

    if (deleteError) {
      console.error('Failed to delete channel:', deleteError);
      return NextResponse.json({ error: 'Failed to delete channel' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Channel deleted successfully'
    });

  } catch (error) {
    console.error('Delete chat channel error:', error);
    return NextResponse.json({ error: 'Failed to delete channel' }, { status: 500 });
  }
}