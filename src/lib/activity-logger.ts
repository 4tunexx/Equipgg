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
  activityData?: unknown;
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
    
    // Build description based on activity type
    let description = '';
    let action = '';
    switch (data.activityType) {
      case 'game_win':
        description = `${data.username} won ${data.amount || 0} coins on ${data.gameType || 'game'}`;
        action = 'won_game';
        break;
      case 'game_loss':
        description = `${data.username} lost game and earned ${data.amount || 0} XP`;
        action = 'lost_game';
        break;
      case 'crate_open':
        description = `${data.username} opened a crate and received ${data.itemName || 'item'}`;
        action = 'opened_crate';
        break;
      case 'level_up':
        description = `${data.username} reached level ${data.amount || 0}`;
        action = 'leveled_up';
        break;
      case 'achievement_unlock':
        description = `${data.username} unlocked achievement: ${data.itemName || 'achievement'}`;
        action = 'unlocked_achievement';
        break;
      default:
        description = `${data.username} performed ${data.activityType}`;
        action = data.activityType;
    }

    // Insert into activity_feed table using EXISTING structure
    await supabase.from('activity_feed').insert([
      {
        user_id: data.userId,
        action,
        description,
        metadata: {
          amount: data.amount || 0,
          xp: data.amount || 0,
          itemName: data.itemName || null,
          itemRarity: data.itemRarity || null,
          gameType: data.gameType || null,
          multiplier: data.multiplier || null,
          activityData: data.activityData || null
        },
        created_at: timestamp,
      },
    ]);
    console.log('Activity logged successfully');
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

export function formatActivityMessage(activity: unknown): string {
  // Type guard to check if activity has the expected structure
  if (typeof activity !== 'object' || activity === null) {
    return 'had some activity';
  }
  
  const act = activity as Record<string, unknown>;
  
  switch (act.activity_type as string) {
    case 'game_win':
      const amount = act.amount as number | undefined;
      const multiplier = act.multiplier as number | undefined;
      const gameType = act.game_type as string | undefined;
      
      if (multiplier && multiplier > 1) {
        // Format multiplier to 2 decimal places and remove trailing zeros
        const formattedMultiplier = parseFloat(multiplier.toFixed(2));
        return `won ${amount?.toLocaleString?.() || '0'} coins with ${formattedMultiplier}x multiplier on ${gameType}`;
      }
      return `won ${amount?.toLocaleString?.() || '0'} coins on ${gameType}`;
    
    case 'game_loss':
      const lossAmount = act.amount as number | undefined;
      const lossGameType = act.game_type as string | undefined;
      return `lost ${lossAmount?.toLocaleString?.() || '0'} coins on ${lossGameType}`;
    
    case 'crate_open':
      const itemName = act.item_name as string | undefined;
      const itemRarity = act.item_rarity as string | undefined;
      return `opened a crate and received ${itemName} (${itemRarity})`;
    
    case 'bet_placed':
      const betAmount = act.amount as number | undefined;
      const betGameType = act.game_type as string | undefined;
      return `placed a ${betAmount?.toLocaleString?.() || '0'} coin bet on ${betGameType}`;
    
    case 'bet_won':
      const wonAmount = act.amount as number | undefined;
      return `won ${wonAmount?.toLocaleString?.() || '0'} coins from bet payout`;
    
    case 'trade_up':
      const tradeItemName = act.item_name as string | undefined;
      const tradeItemRarity = act.item_rarity as string | undefined;
      return `traded up to ${tradeItemName} (${tradeItemRarity})`;
    
    case 'achievement_unlock':
      const activityData = act.activity_data as Record<string, unknown> | undefined;
      const achievementName = activityData?.achievementName as string | undefined;
      return `unlocked achievement: ${achievementName || 'Mystery Achievement'}`;
    
    case 'level_up':
      const levelData = act.activity_data as Record<string, unknown> | undefined;
      const newLevel = levelData?.newLevel as string | undefined;
      return `reached level ${newLevel || 'unknown'}`;
    
    default:
      return 'had some activity';
  }
}
