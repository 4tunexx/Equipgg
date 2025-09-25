import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export interface ActivityLogData {
  userId: string;
  username: string;
  activityType: 'game_win' | 'game_loss' | 'crate_open' | 'bet_placed' | 'bet_won' | 'trade_up' | 'achievement_unlock' | 'level_up';
  amount?: number;
  itemName?: string;
  itemRarity?: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythical';
  gameType?: 'crash' | 'coinflip' | 'sweeper' | 'plinko';
  multiplier?: number;
  activityData?: any;
}

export async function logActivity(data: ActivityLogData): Promise<void> {
  try {
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    console.log('Logging activity:', {
      id,
      userId: data.userId,
      username: data.username,
      activityType: data.activityType,
      amount: data.amount
    });
    
    // Map activity types to actions for the activity_feed table
    const actionMap: Record<string, string> = {
      'game_win': 'won_game',
      'game_loss': 'lost_game',
      'crate_open': 'opened_crate',
      'bet_placed': 'placed_bet',
      'bet_won': 'won_bet',
      'trade_up': 'traded_up',
      'achievement_unlock': 'unlocked_achievement',
      'level_up': 'leveled_up'
    };
    
    // Use the activity_feed table that the API expects
    await supabase.from('activity_feed').insert([
      {
        id,
        user_id: data.userId,
        action: actionMap[data.activityType] || data.activityType,
        xp: data.amount || 0,
        icon: data.itemRarity || null,
        created_at: timestamp,
      },
    ]);
    console.log('Activity logged successfully:', id);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

export function formatActivityMessage(activity: any): string {
  switch (activity.activity_type) {
    case 'game_win':
      if (activity.multiplier && activity.multiplier > 1) {
        // Format multiplier to 2 decimal places and remove trailing zeros
        const formattedMultiplier = parseFloat(activity.multiplier.toFixed(2));
        return `won ${activity.amount?.toLocaleString?.() || '0'} coins with ${formattedMultiplier}x multiplier on ${activity.game_type}`;
      }
      return `won ${activity.amount?.toLocaleString?.() || '0'} coins on ${activity.game_type}`;
    
    case 'game_loss':
      return `lost ${activity.amount?.toLocaleString?.() || '0'} coins on ${activity.game_type}`;
    
    case 'crate_open':
      return `opened a crate and received ${activity.item_name} (${activity.item_rarity})`;
    
    case 'bet_placed':
      return `placed a ${activity.amount?.toLocaleString?.() || '0'} coin bet on ${activity.game_type}`;
    
    case 'bet_won':
      return `won ${activity.amount?.toLocaleString?.() || '0'} coins from bet payout`;
    
    case 'trade_up':
      return `traded up to ${activity.item_name} (${activity.item_rarity})`;
    
    case 'achievement_unlock':
      return `unlocked achievement: ${activity.activity_data?.achievementName || 'Mystery Achievement'}`;
    
    case 'level_up':
      return `reached level ${activity.activity_data?.newLevel || 'unknown'}`;
    
    default:
      return 'had some activity';
  }
}
