import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export interface NotificationData {
  ticketId?: string;
  matchId?: string;
  gameType?: string;
  itemId?: string;
  postId?: string;
  userId?: string;
  amount?: number;
  level?: number;
  achievementId?: string;
  [key: string]: any;
}

export interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: NotificationData;
}

export interface CreateBulkNotificationParams {
  userIds: string[];
  type: string;
  title: string;
  message: string;
  data?: NotificationData;
}

/**
 * Create a single notification for a user
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  data
}: CreateNotificationParams): Promise<void> {
  try {
    const notificationId = uuidv4();
    await supabase.from('notifications').insert([
      {
        id: notificationId,
        user_id: userId,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

/**
 * Create notifications for multiple users
 */
export async function createBulkNotifications({
  userIds,
  type,
  title,
  message,
  data
}: CreateBulkNotificationParams): Promise<void> {
  try {
    const dataString = data ? JSON.stringify(data) : null;
    const now = new Date().toISOString();
    const notifications = userIds.map(userId => ({
      id: uuidv4(),
      user_id: userId,
      type,
      title,
      message,
      data: dataString,
      created_at: now,
    }));
    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
  }
}

/**
 * Create notifications for all users with specific roles
 */
export async function createNotificationsForRoles({
  roles,
  type,
  title,
  message,
  data
}: {
  roles: string[];
  type: string;
  title: string;
  message: string;
  data?: NotificationData;
}): Promise<void> {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id')
      .in('role', roles);
    if (error) throw error;
    if (users && users.length > 0) {
      const userIds = users.map((u: any) => u.id);
      await createBulkNotifications({ userIds, type, title, message, data });
    }
  } catch (error) {
    console.error('Error creating notifications for roles:', error);
  }
}

// Predefined notification creators for common scenarios

/**
 * Gaming & Betting Notifications
 */
export const GamingNotifications = {
  async betWon(userId: string, amount: number, matchId: string, teamName: string) {
    await createNotification({
      userId,
      type: 'bet_won',
      title: '🎉 Bet Won!',
      message: `You won ${(amount || 0).toLocaleString()} coins on ${teamName}!`,
      data: { amount, matchId, teamName }
    });
  },

  async betLost(userId: string, amount: number, matchId: string, teamName: string) {
    await createNotification({
      userId,
      type: 'bet_lost',
      title: '💸 Bet Lost',
      message: `You lost ${(amount || 0).toLocaleString()} coins on ${teamName}. Better luck next time!`,
      data: { amount, matchId, teamName }
    });
  },

  async gameResult(userId: string, gameType: string, multiplier: number, profit: number) {
    await createNotification({
      userId,
      type: 'game_result',
      title: '🎮 Game Complete',
      message: `Crash game: You cashed out at ${multiplier}x multiplier! Profit: ${(profit || 0).toLocaleString()} coins`,
      data: { gameType, multiplier, profit }
    });
  },

  async achievementUnlocked(userId: string, achievementName: string, reward: string) {
    await createNotification({
      userId,
      type: 'achievement',
      title: '🏆 Achievement Unlocked!',
      message: `New Achievement: ${achievementName}! Reward: ${reward}`,
      data: { achievementName, reward }
    });
  },

  async levelUp(userId: string, newLevel: number, rewards: { coins: number; gems: number }) {
    await createNotification({
      userId,
      type: 'level_up',
      title: '⭐ Level Up!',
      message: `Congratulations! You reached Level ${newLevel}! Rewards: ${rewards.coins} coins, ${rewards.gems} gems`,
      data: { level: newLevel, rewards }
    });
  },

  async dailyMissionComplete(userId: string, missionName: string, rewards: { xp: number; coins: number }) {
    await createNotification({
      userId,
      type: 'daily_mission',
      title: '✅ Daily Mission Complete',
      message: `Daily mission completed: ${missionName}! Rewards: +${rewards.xp} XP, +${rewards.coins} coins`,
      data: { missionName, rewards }
    });
  },

  async crateOpening(userId: string, itemName: string, rarity: string, itemId: string) {
    await createNotification({
      userId,
      type: 'crate_opening',
      title: '📦 Rare Item Found!',
      message: `${rarity} item found: ${itemName}!`,
      data: { itemName, rarity, itemId }
    });
  }
};

/**
 * Economy & Rewards Notifications
 */
export const EconomyNotifications = {
  async coinTransaction(userId: string, amount: number, reason: string, type: 'earned' | 'spent') {
    const emoji = type === 'earned' ? '💰' : '💸';
    const action = type === 'earned' ? 'Received' : 'Spent';
    
    await createNotification({
      userId,
      type: 'coin_transaction',
      title: `${emoji} Coins ${action}`,
      message: `${action} ${(amount || 0).toLocaleString()} coins - ${reason}`,
      data: { amount, reason, type }
    });
  },

  async gemTransaction(userId: string, amount: number, reason: string, type: 'earned' | 'spent') {
    const emoji = type === 'earned' ? '💎' : '💸';
    const action = type === 'earned' ? 'Received' : 'Spent';
    
    await createNotification({
      userId,
      type: 'gem_transaction',
      title: `${emoji} Gems ${action}`,
      message: `${action} ${(amount || 0).toLocaleString()} gems - ${reason}`,
      data: { amount, reason, type }
    });
  },

  async purchaseConfirmation(userId: string, itemName: string, cost: number, currency: 'coins' | 'gems') {
    await createNotification({
      userId,
      type: 'purchase',
      title: '🛒 Purchase Successful',
      message: `Purchase successful: ${itemName} for ${(cost || 0).toLocaleString()} ${currency}`,
      data: { itemName, cost, currency }
    });
  },

  async vipStatus(userId: string, status: 'activated' | 'expired') {
    const emoji = status === 'activated' ? '👑' : '⚠️';
    const message = status === 'activated' 
      ? 'Welcome to VIP! Exclusive perks unlocked' 
      : 'Your VIP status has expired';
    
    await createNotification({
      userId,
      type: 'vip_status',
      title: `${emoji} VIP Status`,
      message,
      data: { status }
    });
  }
};

/**
 * Social & Community Notifications
 */
export const SocialNotifications = {
  async friendRequest(userId: string, fromUserName: string, fromUserId: string) {
    await createNotification({
      userId,
      type: 'friend_request',
      title: '👥 Friend Request',
      message: `${fromUserName} sent you a friend request`,
      data: { fromUserName, fromUserId }
    });
  },

  async message(userId: string, fromUserName: string, messagePreview: string, fromUserId: string) {
    await createNotification({
      userId,
      type: 'message',
      title: '💬 New Message',
      message: `${fromUserName}: ${messagePreview}`,
      data: { fromUserName, messagePreview, fromUserId }
    });
  },

  async forumMention(userId: string, postTitle: string, mentionedBy: string, postId: string) {
    await createNotification({
      userId,
      type: 'forum_mention',
      title: '📝 Forum Mention',
      message: `${mentionedBy} mentioned you in "${postTitle}"`,
      data: { postTitle, mentionedBy, postId }
    });
  }
};

/**
 * Admin & Moderator Notifications
 */
export const AdminNotifications = {
  async userReport(reportedUserId: string, reportType: string, reporterName: string, reportId: string) {
    await createNotificationsForRoles({
      roles: ['admin', 'moderator'],
      type: 'user_report',
      title: '🚨 New Report',
      message: `New report: ${reportType} - Reported by ${reporterName}`,
      data: { reportedUserId, reportType, reporterName, reportId }
    });
  },

  async systemAlert(alertType: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical') {
    await createNotificationsForRoles({
      roles: ['admin'],
      type: 'system_alert',
      title: `⚠️ System Alert (${severity.toUpperCase()})`,
      message,
      data: { alertType, severity }
    });
  },

  async userAction(action: string, targetUser: string, reason: string, adminName: string) {
    await createNotificationsForRoles({
      roles: ['admin', 'moderator'],
      type: 'user_action',
      title: '👤 User Action',
      message: `${action}: ${targetUser} - Reason: ${reason} (by ${adminName})`,
      data: { action, targetUser, reason, adminName }
    });
  },

  async revenueUpdate(amount: number, change: number, period: string) {
    await createNotificationsForRoles({
      roles: ['admin'],
      type: 'revenue_update',
      title: '📊 Revenue Update',
      message: `${period} revenue: $${(amount || 0).toLocaleString()} (${change > 0 ? '+' : ''}${change}% from last ${period})`,
      data: { amount, change, period }
    });
  }
};

/**
 * System & Account Notifications
 */
export const SystemNotifications = {
  async loginAlert(userId: string, browser: string, os: string, location: string) {
    await createNotification({
      userId,
      type: 'login_alert',
      title: '🔐 New Login',
      message: `New login from ${browser} on ${os} (${location})`,
      data: { browser, os, location }
    });
  },

  async securityWarning(userId: string, warningType: string, message: string) {
    await createNotification({
      userId,
      type: 'security_warning',
      title: '🛡️ Security Warning',
      message,
      data: { warningType }
    });
  },

  async maintenanceNotice(hoursUntil: number, duration: string) {
    await createBulkNotifications({
      userIds: [], // Will be populated by getting all users
      type: 'maintenance',
      title: '🔧 Scheduled Maintenance',
      message: `Scheduled maintenance in ${hoursUntil} hours. Expected duration: ${duration}`,
      data: { hoursUntil, duration }
    });
  },

  async featureUpdate(featureName: string, description: string) {
    await createBulkNotifications({
      userIds: [], // Will be populated by getting all users
      type: 'feature_update',
      title: '✨ New Feature',
      message: `New feature: ${featureName} - ${description}`,
      data: { featureName, description }
    });
  }
};
