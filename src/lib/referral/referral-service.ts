/**
 * COMPLETE REFERRAL & LOYALTY SYSTEM
 * Full referral tracking, rewards, and loyalty program
 */

import { createServerSupabaseClient } from '../supabase';
import { broadcastNotification } from '../supabase/realtime-client';

export interface ReferralCode {
  code: string;
  user_id: string;
  uses: number;
  max_uses: number;
  reward_type: 'coins' | 'gems' | 'percentage' | 'item';
  reward_amount: number;
  expires_at?: string;
  created_at: string;
}

export interface LoyaltyTier {
  tier: number;
  name: string;
  points_required: number;
  benefits: {
    coin_multiplier: number;
    xp_multiplier: number;
    discount_percentage: number;
    daily_bonus: number;
    exclusive_items: boolean;
    priority_support: boolean;
  };
}

export class ReferralLoyaltyService {
  private readonly REFERRAL_REWARDS = {
    referrer: { coins: 500, gems: 10 },
    referee: { coins: 250, gems: 5 }
  };

  private readonly LOYALTY_TIERS: LoyaltyTier[] = [
    {
      tier: 0,
      name: 'Bronze',
      points_required: 0,
      benefits: {
        coin_multiplier: 1.0,
        xp_multiplier: 1.0,
        discount_percentage: 0,
        daily_bonus: 100,
        exclusive_items: false,
        priority_support: false
      }
    },
    {
      tier: 1,
      name: 'Silver',
      points_required: 1000,
      benefits: {
        coin_multiplier: 1.1,
        xp_multiplier: 1.1,
        discount_percentage: 5,
        daily_bonus: 200,
        exclusive_items: false,
        priority_support: false
      }
    },
    {
      tier: 2,
      name: 'Gold',
      points_required: 5000,
      benefits: {
        coin_multiplier: 1.25,
        xp_multiplier: 1.25,
        discount_percentage: 10,
        daily_bonus: 500,
        exclusive_items: true,
        priority_support: false
      }
    },
    {
      tier: 3,
      name: 'Platinum',
      points_required: 20000,
      benefits: {
        coin_multiplier: 1.5,
        xp_multiplier: 1.5,
        discount_percentage: 15,
        daily_bonus: 1000,
        exclusive_items: true,
        priority_support: true
      }
    },
    {
      tier: 4,
      name: 'Diamond',
      points_required: 50000,
      benefits: {
        coin_multiplier: 2.0,
        xp_multiplier: 2.0,
        discount_percentage: 25,
        daily_bonus: 2500,
        exclusive_items: true,
        priority_support: true
      }
    }
  ];

  /**
   * Generate unique referral code for user
   */
  async generateReferralCode(userId: string): Promise<string> {
    const supabase = createServerSupabaseClient();
    
    // Check if user already has a code
    const { data: existing } = await supabase
      .from('referral_codes')
      .select('code')
      .eq('user_id', userId)
      .eq('is_personal', true)
      .single();

    if (existing) {
      return existing.code;
    }

    // Generate unique code
    const code = await this.generateUniqueCode();
    
    // Create referral code
    await supabase
      .from('referral_codes')
      .insert({
        code,
        user_id: userId,
        is_personal: true,
        uses: 0,
        max_uses: 9999,
        reward_type: 'standard',
        expires_at: null
      });

    return code;
  }

  /**
   * Process referral when new user signs up
   */
  async processReferral(newUserId: string, referralCode: string): Promise<boolean> {
    const supabase = createServerSupabaseClient();

    // Get referral code details
    const { data: codeData } = await supabase
      .from('referral_codes')
      .select('*, user:users(id, displayName)')
      .eq('code', referralCode)
      .single();

    if (!codeData) {
      return false;
    }

    // Check if code is valid
    if (codeData.max_uses && codeData.uses >= codeData.max_uses) {
      return false;
    }

    if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
      return false;
    }

    // Check if user hasn't already used a referral
    const { data: existingReferral } = await supabase
      .from('referral_uses')
      .select('id')
      .eq('referred_user_id', newUserId)
      .single();

    if (existingReferral) {
      return false;
    }

    // Record referral use
    await supabase
      .from('referral_uses')
      .insert({
        referral_code_id: codeData.id,
        referrer_id: codeData.user_id,
        referred_user_id: newUserId,
        rewards_claimed: false
      });

    // Update code usage
    await supabase
      .from('referral_codes')
      .update({ uses: codeData.uses + 1 })
      .eq('id', codeData.id);

    // Award rewards to both users
    await this.awardReferralRewards(codeData.user_id, newUserId);

    // Add loyalty points
    await this.addLoyaltyPoints(codeData.user_id, 100, 'referral');

    // Notify referrer
    await broadcastNotification(codeData.user_id, {
      title: '🎉 Referral Successful!',
      message: `Someone used your referral code! You earned ${this.REFERRAL_REWARDS.referrer.coins} coins and ${this.REFERRAL_REWARDS.referrer.gems} gems!`,
      type: 'referral'
    });

    return true;
  }

  /**
   * Award referral rewards
   */
  private async awardReferralRewards(referrerId: string, refereeId: string): Promise<void> {
    const supabase = createServerSupabaseClient();

    // Award to referrer
    const { data: referrer } = await supabase
      .from('users')
      .select('coins, gems, total_referrals')
      .eq('id', referrerId)
      .single();

    if (referrer) {
      await supabase
        .from('users')
        .update({
          coins: referrer.coins + this.REFERRAL_REWARDS.referrer.coins,
          gems: (referrer.gems || 0) + this.REFERRAL_REWARDS.referrer.gems,
          total_referrals: (referrer.total_referrals || 0) + 1
        })
        .eq('id', referrerId);
    }

    // Award to referee
    const { data: referee } = await supabase
      .from('users')
      .select('coins, gems')
      .eq('id', refereeId)
      .single();

    if (referee) {
      await supabase
        .from('users')
        .update({
          coins: referee.coins + this.REFERRAL_REWARDS.referee.coins,
          gems: (referee.gems || 0) + this.REFERRAL_REWARDS.referee.gems
        })
        .eq('id', refereeId);
    }
  }

  /**
   * Add loyalty points to user
   */
  async addLoyaltyPoints(userId: string, points: number, reason: string): Promise<void> {
    const supabase = createServerSupabaseClient();

    // Get current points
    const { data: user } = await supabase
      .from('users')
      .select('loyalty_points, loyalty_tier')
      .eq('id', userId)
      .single();

    if (!user) return;

    const newPoints = (user.loyalty_points || 0) + points;
    
    // Check for tier upgrade
    const currentTier = this.LOYALTY_TIERS[user.loyalty_tier || 0];
    const newTier = this.calculateLoyaltyTier(newPoints);

    if (newTier.tier > currentTier.tier) {
      // Tier upgrade!
      await this.upgradeLoyaltyTier(userId, newTier);
    }

    // Update points
    await supabase
      .from('users')
      .update({
        loyalty_points: newPoints,
        loyalty_tier: newTier.tier
      })
      .eq('id', userId);

    // Log points earned
    await supabase
      .from('loyalty_points_log')
      .insert({
        user_id: userId,
        points,
        reason,
        balance: newPoints
      });
  }

  /**
   * Calculate loyalty tier based on points
   */
  private calculateLoyaltyTier(points: number): LoyaltyTier {
    for (let i = this.LOYALTY_TIERS.length - 1; i >= 0; i--) {
      if (points >= this.LOYALTY_TIERS[i].points_required) {
        return this.LOYALTY_TIERS[i];
      }
    }
    return this.LOYALTY_TIERS[0];
  }

  /**
   * Upgrade user's loyalty tier
   */
  private async upgradeLoyaltyTier(userId: string, newTier: LoyaltyTier): Promise<void> {
    const supabase = createServerSupabaseClient();

    // Award tier upgrade rewards
    const rewards = {
      coins: newTier.tier * 1000,
      gems: newTier.tier * 50,
      crate_keys: newTier.tier
    };

    const { data: user } = await supabase
      .from('users')
      .select('coins, gems, displayName')
      .eq('id', userId)
      .single();

    if (user) {
      await supabase
        .from('users')
        .update({
          coins: user.coins + rewards.coins,
          gems: (user.gems || 0) + rewards.gems
        })
        .eq('id', userId);

      // Add crate keys
      for (let i = 0; i < rewards.crate_keys; i++) {
        await supabase
          .from('user_keys')
          .insert({
            user_id: userId,
            crate_id: 1, // Level up crate
            quantity: 1
          });
      }

      // Award loyalty badge
      await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: 200 + newTier.tier // Loyalty tier badges
        });

      // Notify user
      await broadcastNotification(userId, {
        title: `🎊 Loyalty Tier Upgraded to ${newTier.name}!`,
        message: `Congratulations! You earned ${rewards.coins} coins, ${rewards.gems} gems, and ${rewards.crate_keys} crate keys!`,
        type: 'loyalty'
      });
    }
  }

  /**
   * Claim daily loyalty bonus
   */
  async claimDailyLoyaltyBonus(userId: string): Promise<any> {
    const supabase = createServerSupabaseClient();

    // Check last claim
    const { data: user } = await supabase
      .from('users')
      .select('loyalty_tier, last_loyalty_claim, coins')
      .eq('id', userId)
      .single();

    if (!user) {
      throw new Error('User not found');
    }

    // Check if already claimed today
    if (user.last_loyalty_claim) {
      const lastClaim = new Date(user.last_loyalty_claim);
      const today = new Date();
      
      if (
        lastClaim.getDate() === today.getDate() &&
        lastClaim.getMonth() === today.getMonth() &&
        lastClaim.getFullYear() === today.getFullYear()
      ) {
        throw new Error('Daily bonus already claimed');
      }
    }

    const tier = this.LOYALTY_TIERS[user.loyalty_tier || 0];
    const bonus = tier.benefits.daily_bonus;

    // Award bonus
    await supabase
      .from('users')
      .update({
        coins: user.coins + bonus,
        last_loyalty_claim: new Date().toISOString()
      })
      .eq('id', userId);

    // Add loyalty points for claiming
    await this.addLoyaltyPoints(userId, 10, 'daily_claim');

    return {
      coins: bonus,
      tier: tier.name,
      next_claim_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
  }

  /**
   * Get user's loyalty status
   */
  async getUserLoyaltyStatus(userId: string): Promise<any> {
    const supabase = createServerSupabaseClient();

    const { data: user } = await supabase
      .from('users')
      .select('loyalty_points, loyalty_tier, total_referrals')
      .eq('id', userId)
      .single();

    if (!user) return null;

    const currentTier = this.LOYALTY_TIERS[user.loyalty_tier || 0];
    const nextTier = this.LOYALTY_TIERS[Math.min(user.loyalty_tier + 1, this.LOYALTY_TIERS.length - 1)];
    const progress = ((user.loyalty_points || 0) - currentTier.points_required) / 
                    (nextTier.points_required - currentTier.points_required) * 100;

    // Get referral code
    const { data: referralCode } = await supabase
      .from('referral_codes')
      .select('code, uses')
      .eq('user_id', userId)
      .eq('is_personal', true)
      .single();

    return {
      points: user.loyalty_points || 0,
      tier: currentTier,
      next_tier: nextTier,
      progress: Math.min(100, Math.max(0, progress)),
      total_referrals: user.total_referrals || 0,
      referral_code: referralCode?.code,
      referral_uses: referralCode?.uses || 0,
      benefits: currentTier.benefits
    };
  }

  /**
   * Apply loyalty benefits to purchase
   */
  async applyLoyaltyDiscount(userId: string, basePrice: number): Promise<number> {
    const status = await this.getUserLoyaltyStatus(userId);
    if (!status) return basePrice;

    const discount = status.tier.benefits.discount_percentage / 100;
    return Math.round(basePrice * (1 - discount));
  }

  /**
   * Get loyalty leaderboard
   */
  async getLoyaltyLeaderboard(limit: number = 100): Promise<any[]> {
    const supabase = createServerSupabaseClient();

    const { data } = await supabase
      .from('users')
      .select('id, displayName, avatar_url, loyalty_points, loyalty_tier')
      .order('loyalty_points', { ascending: false })
      .limit(limit);

    return (data || []).map((user, index) => ({
      rank: index + 1,
      user_id: user.id,
      displayName: user.displayName,
      avatar_url: user.avatar_url,
      points: user.loyalty_points || 0,
      tier: this.LOYALTY_TIERS[user.loyalty_tier || 0]
    }));
  }

  /**
   * Generate unique referral code
   */
  private async generateUniqueCode(): Promise<string> {
    const supabase = createServerSupabaseClient();
    let code: string;
    let isUnique = false;

    while (!isUnique) {
      code = this.generateRandomCode();
      
      const { data } = await supabase
        .from('referral_codes')
        .select('id')
        .eq('code', code)
        .single();

      if (!data) {
        isUnique = true;
      }
    }

    return code!;
  }

  /**
   * Generate random code
   */
  private generateRandomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }
}

// Export singleton
export const referralLoyaltyService = new ReferralLoyaltyService();
