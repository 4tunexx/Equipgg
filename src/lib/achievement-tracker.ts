import { supabase } from '@/lib/supabase';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  requirement_type: string;
  requirement_value: number;
  reward_type: string;
  reward_value: number;
  is_active: boolean;
}

export interface AchievementUpdate {
  userId: string;
  action: string;
  value?: number;
  metadata?: Record<string, any>;
}

async function getWinStreak(userId: string): Promise<number> {
  const { data: bets } = await supabase
    .from('user_bets')
    .select('result')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  let streak = 0;
  for (const bet of bets || []) {
    if (bet.result === 'win') streak++;
    else break;
  }
  return streak;
}

async function getCrashWinStreak(userId: string): Promise<number> {
  const { data: games } = await supabase
    .from('game_history')
    .select('result')
    .eq('user_id', userId)
    .eq('game_type', 'crash')
    .order('created_at', { ascending: false })
    .limit(10);

  let streak = 0;
  for (const game of games || []) {
    if (game.result === 'win') streak++;
    else break;
  }
  return streak;
}

async function getAchievementProgress(userId: string, type: string): Promise<number> {
  const { data } = await supabase
    .from('achievement_progress')
    .select('progress')
    .eq('user_id', userId)
    .eq('type', type)
    .single();
  return data?.progress || 0;
}

async function hasCrashedOutAt3x(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('game_history')
    .select()
    .eq('user_id', userId)
    .eq('game_type', 'crash')
    .gte('cashout_multiplier', 3.0)
    .maybeSingle();
  return !!data;
}

async function hasCleared10Tiles(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('game_history')
    .select()
    .eq('user_id', userId)
    .eq('game_type', 'sweeper')
    .gte('tiles_cleared', 10)
    .maybeSingle();
  return !!data;
}

async function hasWonHighOddsBet(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_bets')
    .select()
    .eq('user_id', userId)
    .eq('result', 'win')
    .gte('odds', 5.0)
    .maybeSingle();
  return !!data;
}

async function hasWonJackpot(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('jackpot_wins')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

async function getDailyLoginStreak(userId: string): Promise<number> {
  const { data } = await supabase
    .from('user_stats')
    .select('daily_login_streak')
    .eq('user_id', userId)
    .single();
  return data?.daily_login_streak || 0;
}

async function getTotalShopSpending(userId: string): Promise<number> {
  const { data } = await supabase
    .from('user_purchases')
    .select('amount')
    .eq('user_id', userId);
  return (data || []).reduce((sum, p) => sum + (p.amount || 0), 0);
}

async function unlockAchievement(userId: string, achievement: Achievement): Promise<void> {
  await supabase.from('user_achievements').insert({
    user_id: userId,
    achievement_id: achievement.id,
    unlocked_at: new Date().toISOString()
  });
}

export async function checkAndUnlockAchievements(update: AchievementUpdate): Promise<void> {
  try {
    const { data: achievements } = await supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true)
      .eq('requirement_type', update.action);

    if (!achievements?.length) return;

    for (const achievement of achievements) {
      const { data: existing } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', update.userId)
        .eq('achievement_id', achievement.id)
        .maybeSingle();

      if (existing) continue;

      let shouldUnlock = false;
      let currentProgress = 0;

      switch (achievement.requirement_type) {
        case 'win_streak':
          currentProgress = await getWinStreak(update.userId);
          break;
        case 'crash_win_streak':
          currentProgress = await getCrashWinStreak(update.userId);
          break;
        case 'crash_cashout_3x':
          shouldUnlock = await hasCrashedOutAt3x(update.userId);
          break;
        case 'sweeper_clear_10':
          shouldUnlock = await hasCleared10Tiles(update.userId);
          break;
        case 'high_odds_win':
          shouldUnlock = await hasWonHighOddsBet(update.userId);
          break;
        case 'jackpot_win':
          shouldUnlock = await hasWonJackpot(update.userId);
          break;
        case 'daily_login_streak':
          currentProgress = await getDailyLoginStreak(update.userId);
          break;
        case 'shop_spend':
          currentProgress = await getTotalShopSpending(update.userId);
          break;
        default:
          currentProgress = await getAchievementProgress(update.userId, achievement.requirement_type);
      }

      if (shouldUnlock || currentProgress >= achievement.requirement_value) {
        await unlockAchievement(update.userId, achievement);
      }
    }
  } catch (error) {
    console.error('Error in checkAndUnlockAchievements:', error);
  }
}

export async function trackCollectionAchievement(userId: string, itemType: string) {
  try {
    // TODO: Implement collection achievement tracking with Supabase
    console.log(`Tracking collection achievement for user ${userId}, item type ${itemType}`);
    return { success: true };
  } catch (error) {
    console.error('Error tracking collection achievement:', error);
    return { success: false, error };
  }
}
