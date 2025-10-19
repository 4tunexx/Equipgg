/**
 * Notification Service
 * Handles toast notifications for achievements, XP, rewards, etc.
 * No longer uses Socket.IO - all real-time updates via Supabase Realtime
 */

export interface AchievementNotification {
  id: string;
  title: string;
  description: string;
  icon?: string;
  xpReward?: number;
  coinReward?: number;
  gemReward?: number;
  userId: string;
  timestamp: Date;
}

export interface NotificationService {
  showAchievementUnlock: (achievement: any, rewards: any) => void;
  showXpGain: (amount: number, source: string) => void;
  showRewardGain: (coins: number, gems: number, xp: number) => void;
}

export class AchievementNotificationService implements NotificationService {
  private toastFunction: any;

  constructor(toastFunction: any = null) {
    this.toastFunction = toastFunction;
  }

  updateToast(toastFunction: any) {
    this.toastFunction = toastFunction;
  }

  showAchievementUnlock(achievement: any, rewards: any) {
    const notification: AchievementNotification = {
      id: `achievement-${achievement.id}-${Date.now()}`,
      title: `🏆 Achievement Unlocked!`,
      description: `${achievement.name}: ${achievement.description}`,
      icon: achievement.icon_url || '🏆',
      xpReward: rewards.xp || 0,
      coinReward: rewards.coins || 0,
      gemReward: rewards.gems || 0,
      userId: rewards.userId,
      timestamp: new Date(),
    };

    // Show toast notification
    if (this.toastFunction) {
      this.toastFunction({
        title: notification.title,
        description: `${achievement.name}: ${achievement.description}`,
        duration: 8000,
        className: "bg-gradient-to-r from-yellow-500 to-orange-500 border-yellow-400 text-white",
      });
    }

    // Show reward gains if any
    if (rewards.xp > 0 || rewards.coins > 0 || rewards.gems > 0) {
      setTimeout(() => {
        this.showRewardGain(rewards.coins || 0, rewards.gems || 0, rewards.xp || 0);
      }, 1000);
    }

    // Log achievement unlock for analytics
    console.log('🏆 Achievement Unlocked:', {
      achievement: achievement.name,
      rewards,
      timestamp: notification.timestamp,
    });
  }

  showXpGain(amount: number, source: string) {
    if (this.toastFunction && amount > 0) {
      this.toastFunction({
        title: `✨ +${amount} XP`,
        description: `Gained from ${source}`,
        duration: 3000,
        className: "bg-gradient-to-r from-blue-500 to-purple-500 border-blue-400 text-white",
      });
    }
  }

  showRewardGain(coins: number, gems: number, xp: number) {
    const rewards: string[] = [];
    if (coins > 0) rewards.push(`💰 +${coins} coins`);
    if (gems > 0) rewards.push(`💎 +${gems} gems`);
    if (xp > 0) rewards.push(`✨ +${xp} XP`);

    if (rewards.length > 0 && this.toastFunction) {
      this.toastFunction({
        title: "🎁 Rewards Earned!",
        description: rewards.join(', '),
        duration: 5000,
        className: "bg-gradient-to-r from-green-500 to-emerald-500 border-green-400 text-white",
      });
    }
  }

  showLevelUp(newLevel: number, xpGained: number) {
    if (this.toastFunction) {
      this.toastFunction({
        title: `🚀 Level Up!`,
        description: `You've reached level ${newLevel}! (+${xpGained} XP)`,
        duration: 8000,
        className: "bg-gradient-to-r from-purple-500 to-pink-500 border-purple-400 text-white",
      });
    }
  }

  showBetPlaced(amount: number, team: string, match: string) {
    if (this.toastFunction) {
      this.toastFunction({
        title: "🎲 Bet Placed!",
        description: `${amount} coins on ${team} (${match})`,
        duration: 4000,
        className: "bg-gradient-to-r from-indigo-500 to-blue-500 border-indigo-400 text-white",
      });
    }
  }

  showError(message: string) {
    if (this.toastFunction) {
      this.toastFunction({
        title: "❌ Error",
        description: message,
        duration: 5000,
        variant: "destructive",
      });
    }
  }

  showSuccess(message: string) {
    if (this.toastFunction) {
      this.toastFunction({
        title: "✅ Success",
        description: message,
        duration: 3000,
        className: "bg-gradient-to-r from-green-500 to-emerald-500 border-green-400 text-white",
      });
    }
  }
}

// Global notification service instance
export const notificationService = new AchievementNotificationService();