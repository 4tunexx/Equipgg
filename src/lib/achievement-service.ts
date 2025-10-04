// Achievement Service - Handles unlocking achievements and tracking progress
import { createClient } from '@supabase/supabase-js';
import { notificationService } from './notification-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Achievement {
  id: number;
  name: string;
  description: string;
  category: string;
  xp_reward: number;
  coin_reward?: number;
  gem_reward?: number;
  is_active: boolean;
}

export interface AchievementUnlock {
  achievement: Achievement;
  isFirstTime: boolean;
  xpGained: number;
  coinsGained: number;
  gemsGained: number;
}

class AchievementService {
  private supabase = supabase;

  /**
   * Check and unlock achievements for a user based on an action
   */
  async checkAchievements(userId: string, action: string, data?: any): Promise<AchievementUnlock[]> {
    try {
      console.log(`🏆 Checking achievements for user ${userId}, action: ${action}`);
      
      const unlocked: AchievementUnlock[] = [];
      
      // Get all relevant achievements
      const { data: achievements, error: achievementsError } = await this.supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true);
        
      if (achievementsError || !achievements) {
        console.error('Error fetching achievements:', achievementsError);
        return [];
      }
      
      // Get user's current achievements
      const { data: userAchievements, error: userAchievementsError } = await this.supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', userId);
        
      if (userAchievementsError) {
        console.error('Error fetching user achievements:', userAchievementsError);
        return [];
      }
      
      const unlockedAchievementIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
      
      // Check achievements based on action
      for (const achievement of achievements) {
        if (unlockedAchievementIds.has(achievement.id)) {
          continue; // Already unlocked
        }
        
        const shouldUnlock = await this.shouldUnlockAchievement(userId, achievement, action, data);
        if (shouldUnlock) {
          const unlockResult = await this.unlockAchievement(userId, achievement);
          if (unlockResult) {
            unlocked.push(unlockResult);
          }
        }
      }
      
      return unlocked;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }
  
  /**
   * Determine if an achievement should be unlocked based on action and data
   */
  private async shouldUnlockAchievement(userId: string, achievement: Achievement, action: string, data?: any): Promise<boolean> {
    try {
      // Betting achievements
      if (achievement.name === 'Getting Started' && action === 'bet_placed') {
        return true; // First bet placed
      }
      
      if (achievement.name === 'First Victory' && action === 'bet_won') {
        return true; // First bet won
      }
      
      if (achievement.name === 'Regular Bettor' && action === 'bet_placed') {
        // Check if user has placed 50 bets total
        const { count } = await this.supabase
          .from('bets')
          .select('id', { count: 'exact' })
          .eq('user_id', userId);
        return (count || 0) >= 50;
      }
      
      if (achievement.name === 'Consistent Winner' && action === 'bet_won') {
        // Check if user has won 50 bets total
        const { count } = await this.supabase
          .from('bets')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .eq('status', 'won');
        return (count || 0) >= 50;
      }
      
      if (achievement.name === 'High Roller' && action === 'bet_placed') {
        // Check if bet amount is over 10,000 coins payout
        return data?.payout && data.payout > 10000;
      }
      
      // Economic achievements
      if (achievement.name === 'Pocket Money' && action === 'coins_updated') {
        // Check if user has 10,000+ coins
        return data?.totalCoins >= 10000;
      }
      
      if (achievement.name === 'First Sale' && action === 'item_sold') {
        return true; // First item sold
      }
      
      if (achievement.name === 'Unboxer' && action === 'crate_opened') {
        return true; // First crate opened
      }
      
      if (achievement.name === 'Perkaholic' && action === 'perk_bought') {
        return true; // First perk bought
      }
      
      // Progression achievements
      if (achievement.name === 'Getting Serious' && action === 'level_up') {
        return data?.level >= 10;
      }
      
      if (achievement.name === 'Quarter Century Club' && action === 'level_up') {
        return data?.level >= 25;
      }
      
      if (achievement.name === 'Halfway There' && action === 'level_up') {
        return data?.level >= 50;
      }
      
      if (achievement.name === 'The Pinnacle' && action === 'level_up') {
        return data?.level >= 100;
      }
      
      if (achievement.name === 'Daily Grind' && action === 'mission_completed') {
        // Check if user has completed 10 daily missions
        const { count } = await this.supabase
          .from('user_mission_progress')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .eq('completed', true)
          .in('mission_id', data?.dailyMissionIds || []);
        return (count || 0) >= 10;
      }
      
      // Social achievements
      if (achievement.name === 'Voice in the Crowd' && action === 'forum_post') {
        return true; // First forum post
      }
      
      if (achievement.name === 'Interior Decorator' && action === 'profile_customized') {
        return true; // First profile customization
      }
      
      return false;
    } catch (error) {
      console.error('Error checking achievement condition:', error);
      return false;
    }
  }
  
  /**
   * Unlock an achievement for a user
   */
  private async unlockAchievement(userId: string, achievement: Achievement): Promise<AchievementUnlock | null> {
    try {
      console.log(`🎉 Unlocking achievement "${achievement.name}" for user ${userId}`);
      
      // Insert user achievement record
      const { error: insertError } = await this.supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
          unlocked_at: new Date().toISOString()
        });
        
      if (insertError) {
        console.error('Error inserting user achievement:', insertError);
        return null;
      }
      
      // Award XP and coins
      const xpGained = achievement.xp_reward || 0;
      const coinsGained = achievement.coin_reward || 0;
      const gemsGained = achievement.gem_reward || 0;
      
      if (xpGained > 0 || coinsGained > 0 || gemsGained > 0) {
        await this.awardRewards(userId, xpGained, coinsGained, gemsGained);
      }
      
      // Show notification
      notificationService.showAchievementUnlock(achievement, {
        userId,
        xp: xpGained,
        coins: coinsGained,
        gems: gemsGained,
      });
      
      return {
        achievement,
        isFirstTime: true,
        xpGained,
        coinsGained,
        gemsGained
      };
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      return null;
    }
  }
  
  /**
   * Award XP, coins, and gems to a user
   */
  private async awardRewards(userId: string, xp: number, coins: number, gems: number): Promise<void> {
    try {
      if (xp > 0 || coins > 0 || gems > 0) {
        // Update user's XP, coins, and gems
        const updates: any = {};
        if (xp > 0) updates.xp = `xp + ${xp}`;
        if (coins > 0) updates.coins = `coins + ${coins}`;
        if (gems > 0) updates.gems = `gems + ${gems}`;
        
        // Use raw SQL for atomic updates
        const { error } = await this.supabase.rpc('update_user_rewards', {
          user_id: userId,
          xp_to_add: xp,
          coins_to_add: coins,
          gems_to_add: gems
        });
        
        if (error) {
          console.error('Error awarding rewards:', error);
          // Fallback to regular update
          const { error: updateError } = await this.supabase
            .from('users')
            .update({
              xp: `xp + ${xp}`,
              coins: `coins + ${coins}`,
              gems: `gems + ${gems}`
            })
            .eq('id', userId);
          
          if (updateError) {
            console.error('Error with fallback reward update:', updateError);
          }
        }
        
        console.log(`✅ Awarded ${xp} XP, ${coins} coins, ${gems} gems to user ${userId}`);
      }
    } catch (error) {
      console.error('Error awarding rewards:', error);
    }
  }
}

export const achievementService = new AchievementService();