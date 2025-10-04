import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from "../../../../lib/auth-utils";
import { 
  GamingNotifications, 
  EconomyNotifications, 
  SocialNotifications, 
  AdminNotifications 
} from "../../../../lib/notification-utils";

// POST - Create demo notifications for the current user
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const { type, count = 1 } = await request.json();

    const notifications: string[] = [];

    for (let i = 0; i < count; i++) {
      switch (type) {
        case 'bet_won':
          await GamingNotifications.betWon(
            session.user_id, 
            500 + (i * 100), 
            `match-${Date.now()}-${i}`, 
            `Team Alpha ${i + 1}`
          );
          notifications.push('Bet won notification created');
          break;

        case 'bet_lost':
          await GamingNotifications.betLost(
            session.user_id, 
            250 + (i * 50), 
            `match-${Date.now()}-${i}`, 
            `Team Beta ${i + 1}`
          );
          notifications.push('Bet lost notification created');
          break;

        case 'game_result':
          await GamingNotifications.gameResult(
            session.user_id, 
            'crash', 
            2.5 + (i * 0.5), 
            750 + (i * 100)
          );
          notifications.push('Game result notification created');
          break;

        case 'achievement':
          await GamingNotifications.achievementUnlocked(
            session.user_id, 
            `First Win ${i + 1}`, 
            'You won your first bet!'
          );
          notifications.push('Achievement notification created');
          break;

        case 'level_up':
          await GamingNotifications.levelUp(
            session.user_id, 
            5 + i, 
            { coins: 1000 + (i * 500), gems: 10 + i }
          );
          notifications.push('Level up notification created');
          break;

        case 'coin_reward':
          await EconomyNotifications.coinTransaction(
            session.user_id, 
            1000 + (i * 500), 
            'daily_bonus',
            'earned'
          );
          notifications.push('Coin reward notification created');
          break;

        case 'purchase':
          await EconomyNotifications.purchaseConfirmation(
            session.user_id, 
            'Premium Crate', 
            500 + (i * 100),
            'coins'
          );
          notifications.push('Purchase notification created');
          break;

        case 'admin_announcement':
          await AdminNotifications.systemAlert(
            'System Update', 
            'New features have been added to the platform!',
            'low'
          );
          notifications.push('Admin announcement created');
          break;

        case 'news_update':
          await AdminNotifications.systemAlert(
            'Weekly News', 
            'Check out the latest gaming news and updates!',
            'low'
          );
          notifications.push('News update created');
          break;

        case 'support_ticket':
          await AdminNotifications.userReport(
            session.user_id, 
            'Support Request',
            'Demo User',
            `ticket-${Date.now()}-${i}`
          );
          notifications.push('Support ticket notification created');
          break;

        case 'friend_request':
          await SocialNotifications.friendRequest(
            session.user_id, 
            `user-${i}`, 
            `Player${i + 1}`
          );
          notifications.push('Friend request notification created');
          break;

        case 'message_received':
          await SocialNotifications.message(
            session.user_id, 
            `Player${i + 1}`, 
            `Hello! This is message ${i + 1}`,
            `user-${i}`
          );
          notifications.push('Message notification created');
          break;

        case 'all':
          // Create one of each type
          await GamingNotifications.betWon(session.user_id, 500, 'match-1', 'Team Alpha');
          await GamingNotifications.achievementUnlocked(session.user_id, 'First Win', 'You won your first bet!');
          await EconomyNotifications.coinTransaction(session.user_id, 1000, 'daily_bonus', 'earned');
          await AdminNotifications.systemAlert('Welcome!', 'Welcome to EquipGG!', 'low');
          await SocialNotifications.friendRequest(session.user_id, 'TestPlayer', 'user-123');
          notifications.push('All notification types created');
          break;

        default:
          return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Created ${count} ${type} notification(s)`,
      notifications 
    });

  } catch (error) {
    console.error('Error creating demo notifications:', error);
    return NextResponse.json({ error: 'Failed to create notifications' }, { status: 500 });
  }
}
