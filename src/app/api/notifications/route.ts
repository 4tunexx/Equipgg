import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from "../../../lib/auth-utils";
import { createServerSupabaseClient } from "../../../lib/supabase";
import { createSupabaseQueries } from "../../../lib/supabase/queries";

// GET - Fetch user notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const supabase = createServerSupabaseClient();
    const queries = createSupabaseQueries(supabase);
    
    let user;
    try {
      user = await queries.getUserById(session.user_id);
    } catch (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const notifications = await queries.getUserNotifications(user.id, 50);

    // Parse notification data and add navigation info
    const enrichedNotifications = notifications.map(notification => {
      let navigationData = null;
      
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
            navigationData = { route: '/dashboard/profile', params: { tab: 'achievements' } };
            break;
          case 'level_up':
            navigationData = { route: '/dashboard/profile', params: { tab: 'stats' } };
            break;
          case 'crate_opening':
            navigationData = { route: '/dashboard/crates', params: { highlight: data.itemId } };
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
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const { notificationIds } = await request.json();

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json({ error: 'Invalid notification IDs' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const queries = createSupabaseQueries(supabase);
    const user = await queries.getUserById(session.user_id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Mark notifications as read
    await queries.markNotificationsRead(user.id, notificationIds);

    return NextResponse.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}