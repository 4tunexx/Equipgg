import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';
import { GamingNotifications, EconomyNotifications, SocialNotifications } from '@/lib/notification-utils';

// POST - Create test notifications for the current user
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const { type } = await request.json();

    switch (type) {
      case 'bet_won':
        await GamingNotifications.betWon(session.user_id, 500, 'match-123', 'Team Alpha');
        break;
      case 'bet_lost':
        await GamingNotifications.betLost(session.user_id, 250, 'match-124', 'Team Beta');
        break;
      case 'game_result':
        await GamingNotifications.gameResult(session.user_id, 'crash', 2.5, 750);
        break;
      case 'achievement':
        await GamingNotifications.achievementUnlocked(session.user_id, 'First Win', '100 coins + 50 XP');
        break;
      case 'level_up':
        await GamingNotifications.levelUp(session.user_id, 15, { coins: 1000, gems: 50 });
        break;
      case 'daily_mission':
        await GamingNotifications.dailyMissionComplete(session.user_id, 'Win 3 Games', { xp: 100, coins: 50 });
        break;
      case 'crate_opening':
        await GamingNotifications.crateOpening(session.user_id, 'AK-47 Redline', 'Rare', 'item-123');
        break;
      case 'coin_transaction':
        await EconomyNotifications.coinTransaction(session.user_id, 1000, 'Daily bonus', 'earned');
        break;
      case 'gem_transaction':
        await EconomyNotifications.gemTransaction(session.user_id, 100, 'VIP purchase', 'spent');
        break;
      case 'purchase':
        await EconomyNotifications.purchaseConfirmation(session.user_id, 'Premium Crate', 500, 'gems');
        break;
      case 'friend_request':
        await SocialNotifications.friendRequest(session.user_id, 'ShadowHunter', 'user-456');
        break;
      case 'message':
        await SocialNotifications.message(session.user_id, 'CyberNinja', 'Hey, want to team up for the next match?', 'user-789');
        break;
      case 'forum_mention':
        await SocialNotifications.forumMention(session.user_id, 'Best CS2 Strategies', 'QuantumGamer', 'post-123');
        break;
      case 'all':
        // Create multiple test notifications
        await GamingNotifications.betWon(session.user_id, 500, 'match-123', 'Team Alpha');
        await GamingNotifications.levelUp(session.user_id, 15, { coins: 1000, gems: 50 });
        await GamingNotifications.achievementUnlocked(session.user_id, 'First Win', '100 coins + 50 XP');
        await EconomyNotifications.coinTransaction(session.user_id, 1000, 'Daily bonus', 'earned');
        await SocialNotifications.friendRequest(session.user_id, 'ShadowHunter', 'user-456');
        break;
      default:
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Test notification of type '${type}' created successfully` 
    });
  } catch (error) {
    console.error('Error creating test notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
