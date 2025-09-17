
import { supabase } from './supabase';

export interface ActivePerk {
  id: string;
  perk_id: string;
  perk_name: string;
  perk_type: string;
  duration_hours: number | null;
  expires_at: string | null;
  is_active: boolean;
  applied_at: string;
}

export async function getActivePerks(userId: string): Promise<ActivePerk[]> {
  try {
    // Get all active perks for the user
    const { data: perks, error } = await supabase
      .from('user_perks')
      .select('id, perk_id, perk_name, perk_type, duration_hours, expires_at, is_active, applied_at')
      .eq('user_id', userId)
      .eq('is_active', 1)
      .order('applied_at', { ascending: false });
    if (error || !perks) throw error;

    // Filter out expired perks
    const now = new Date();
    const activePerks: ActivePerk[] = perks.filter((perk: ActivePerk) => {
      if (!perk.expires_at) return true; // Permanent perks
      return new Date(perk.expires_at) > now;
    });

    // Deactivate expired perks
    const expiredPerks: ActivePerk[] = perks.filter((perk: ActivePerk) => {
      if (!perk.expires_at) return false; // Permanent perks don't expire
      return new Date(perk.expires_at) <= now;
    });

    if (expiredPerks.length > 0) {
      const expiredIds = expiredPerks.map((p: ActivePerk) => p.id);
      await supabase
        .from('user_perks')
        .update({ is_active: 0 })
        .in('id', expiredIds);
    }

    return activePerks;
  } catch (error) {
    console.error('Error getting active perks:', error);
    return [];
  }
}

export function calculatePerkEffects(perks: ActivePerk[], baseXp: number, baseCoins: number, activityType: string) {
  let xpMultiplier = 1;
  let coinMultiplier = 1;
  let bonusXp = 0;
  let bonusCoins = 0;
  const appliedPerks: string[] = [];

  for (const perk of perks) {
    const perkName = perk.perk_name;

    // XP Boost perks
    if (perkName.includes('2x XP Boost')) {
      xpMultiplier *= 2;
      appliedPerks.push('2x XP Boost');
    } else if (perkName.includes('1.5x XP Boost')) {
      xpMultiplier *= 1.5;
      appliedPerks.push('1.5x XP Boost');
    } else if (perkName.includes('Mission XP Doubler') && activityType === 'mission_complete') {
      xpMultiplier *= 2;
      appliedPerks.push('Mission XP Doubler');
    }

    // Coin boost perks
    if (perkName.includes('+10% Coin Wins') && (activityType === 'game_win' || activityType === 'bet_won')) {
      coinMultiplier *= 1.1;
      appliedPerks.push('+10% Coin Wins');
    }

    // Free bet tokens
    if (perkName.includes('Free Bet Token (500 Coins)')) {
      bonusCoins += 500;
      appliedPerks.push('Free Bet Token (500 Coins)');
    } else if (perkName.includes('Free Bet Token (2500 Coins)')) {
      bonusCoins += 2500;
      appliedPerks.push('Free Bet Token (2500 Coins)');
    }
  }

  const finalXp = Math.floor(baseXp * xpMultiplier);
  const finalCoins = Math.floor(baseCoins * coinMultiplier) + bonusCoins;

  return {
    finalXp,
    finalCoins,
    xpMultiplier,
    coinMultiplier,
    bonusXp,
    bonusCoins,
    appliedPerks
  };
}

export function hasInventorySlotPerk(perks: ActivePerk[]): number {
  let extraSlots = 0;
  
  for (const perk of perks) {
    if (perk.perk_name.includes('+1 Inventory Slot')) {
      extraSlots += 1;
    } else if (perk.perk_name.includes('+5 Inventory Slots')) {
      extraSlots += 5;
    }
  }
  
  return extraSlots;
}

export function hasRarityBooster(perks: ActivePerk[]): boolean {
  return perks.some(perk => perk.perk_name.includes('Rarity Booster'));
}

export function hasResellBoost(perks: ActivePerk[]): boolean {
  return perks.some(perk => perk.perk_name.includes('Resell Boost'));
}

export function hasBetInsurance(perks: ActivePerk[]): boolean {
  return perks.some(perk => perk.perk_name.includes('Bet Insurance'));
}

export function hasOddsBooster(perks: ActivePerk[]): number {
  let boost = 0;
  
  for (const perk of perks) {
    if (perk.perk_name.includes('Odds Booster (x0.1)')) {
      boost += 0.1;
    } else if (perk.perk_name.includes('Odds Booster (x0.3)')) {
      boost += 0.3;
    }
  }
  
  return boost;
}

export function hasBetRefundToken(perks: ActivePerk[]): boolean {
  return perks.some(perk => perk.perk_name.includes('Bet Refund Token'));
}

export function hasStatTrakTool(perks: ActivePerk[]): boolean {
  return perks.some(perk => perk.perk_name.includes('StatTrak™ Application Tool'));
}

export function getCosmeticEffects(perks: ActivePerk[]) {
  const effects = {
    nicknameGlow: null as string | null,
    profileBackground: false,
    chatColor: null as string | null,
    chatBadge: false
  };

  for (const perk of perks) {
    if (perk.perk_name.includes('White Nickname Glow')) {
      effects.nicknameGlow = 'white';
    } else if (perk.perk_name.includes('Orange Nickname Glow')) {
      effects.nicknameGlow = 'orange';
    } else if (perk.perk_name.includes('Purple Nickname Glow')) {
      effects.nicknameGlow = 'purple';
    } else if (perk.perk_name.includes('Animated Profile Background')) {
      effects.profileBackground = true;
    } else if (perk.perk_name.includes('Orange Chat Color')) {
      effects.chatColor = 'orange';
    } else if (perk.perk_name.includes('Supporter Chat Badge')) {
      effects.chatBadge = true;
    }
  }

  return effects;
}
