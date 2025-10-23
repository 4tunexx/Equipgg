import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from "../../../lib/auth-utils";
import { createServerSupabaseClient } from "../../../lib/supabase";
import { createSupabaseQueries } from "../../../lib/supabase/queries";
import { createClient } from '@supabase/supabase-js';

// Create Supabase admin client for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// GET - Fetch user notifications
export async function GET(request: NextRequest) {
  try {
    console.log('📡 GET /api/notifications');
    const session = await getAuthSession(request);
    
    if (!session) {
      console.error('❌ Unauthorized request to notifications');
      return createUnauthorizedResponse();
    }

    const user_id = session.user_id;
    console.log('🔍 Fetching notifications for user:', user_id);
    
    // Direct query with admin client to bypass RLS
    // This ensures we get notifications even if RLS policies are restrictive
    const { data: notifications, error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (notificationsError) {
      console.error('❌ Error fetching notifications:', notificationsError);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
    
    console.log('✅ Found notifications:', notifications?.length || 0);

    // Parse notification data and add navigation info
    const enrichedNotifications = notifications.map(notification => {
      let navigationData: { route: string; params: any } | null = null;
      
      try {
        const data = notification.data ? JSON.parse(notification.data) : {};
        
        // Add navigation routes based on notification type
        switch (notification.type) {
          case 'support_ticket':
            navigationData = { route: '/dashboard/support', params: { ticketId: data.ticketId } };
            break;
          case 'support_reply':
            navigationData = { route: '/dashboard/support', params: { ticketId: data.ticketId } };
            break;
          case 'bet_won':
          case 'bet_lost':
            navigationData = { route: '/dashboard/betting', params: { matchId: data.matchId } };
            break;
          case 'game_result':
            navigationData = { route: '/dashboard/arcade', params: { game: data.gameType } };
            break;
          case 'achievement':
          case 'mission_completed':
            navigationData = { route: '/dashboard/profile', params: { tab: 'achievements' } };
            break;
          case 'level_up':
            navigationData = { route: '/dashboard/profile', params: { tab: 'stats' } };
            break;
          case 'item_received':
          case 'crate_opening':
            navigationData = { route: '/dashboard/inventory', params: { highlight: data.itemId } };
            break;
          case 'reward':
            navigationData = { route: data.linkTo || '/dashboard/crates', params: {} };
            break;
          case 'friend_request':
            navigationData = { route: '/dashboard/community', params: { tab: 'friends' } };
            break;
          case 'message':
            navigationData = { route: '/dashboard/community', params: { tab: 'messages' } };
            break;
          case 'forum_mention':
            navigationData = { route: '/dashboard/community', params: { tab: 'forum', postId: data.postId } };
            break;
          case 'user_report':
            navigationData = { route: '/dashboard/moderator', params: { tab: 'reports' } };
            break;
          case 'system_alert':
            navigationData = { route: '/dashboard/admin', params: { tab: 'system' } };
            break;
          default:
            navigationData = null;
        }
      } catch (error) {
        console.error('Error parsing notification data:', error);
      }
      
      return {
        ...notification,
        navigationData
      };
    });

    return NextResponse.json({ notifications: enrichedNotifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    console.log('🔔 PUT /api/notifications - Mark as read');
    const session = await getAuthSession(request);
    
    if (!session) {
      console.error('❌ Unauthorized request to mark notifications as read');
      return createUnauthorizedResponse();
    }

    const { notificationIds } = await request.json();
    console.log('📡 Request to mark notifications as read:', notificationIds);

    if (!notificationIds || !Array.isArray(notificationIds)) {
      console.error('❌ Invalid notification IDs:', notificationIds);
      return NextResponse.json({ error: 'Invalid notification IDs' }, { status: 400 });
    }

    // Use admin client to bypass RLS policies
    const user_id = session.user_id;
    
    // Mark notifications as read directly with the admin client
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user_id)
      .in('id', notificationIds)
      .select();
    
    if (error) {
      console.error('❌ Error marking notifications as read:', error);
      return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
    }
    
    console.log('✅ Marked notifications as read:', data?.length || 0);

    return NextResponse.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}