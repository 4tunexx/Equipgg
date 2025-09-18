// Base database types for Supabase tables
export interface BaseModel {
  id: string;
  created_at?: string;
  updated_at?: string;
}

export interface User extends BaseModel {
  username: string;
  email: string;
  role: UserRole;
  level: number;
  xp: number;
  coins: number;
  gems: number;
  steamId?: string;
  steamProfile?: Record<string, any>;
  provider?: string;
  avatar_url?: string;
  banned?: boolean;
}

export type UserRole = 'user' | 'admin' | 'moderator';

export interface Activity extends BaseModel {
  user_id: string;
  username: string;
  activity_type: ActivityType;
  activity_data?: Record<string, any> | null;
  amount?: number | null;
  item_name?: string | null;
  item_rarity?: ItemRarity | null;
  game_type?: GameType | null;
  multiplier?: number | null;
}

export type ActivityType = 
  | 'game_win'
  | 'crate_open'
  | 'bet_placed'
  | 'achievement_unlock'
  | 'level_up'
  | 'mission_completed'
  | 'coin_win'
  | 'item_unboxed';

export type ItemRarity = 
  | 'Common'
  | 'Uncommon' 
  | 'Rare'
  | 'Epic'
  | 'Legendary'
  | 'Mythical';

export type GameType = 
  | 'crash'
  | 'coinflip'
  | 'jackpot'
  | 'roulette';

export interface Achievement extends BaseModel {
  title: string;
  description: string;
  type: string;
  tier: number;
  xp_reward: number;
  coin_reward: number;
  gem_reward: number;
  requirement_type: string;
  requirement_value: number;
}

export interface UserAchievement extends BaseModel {
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  progress: number;
}

export interface ShopItem extends BaseModel {
  name: string;
  description: string;
  price: number;
  currency: 'coins' | 'gems';
  type: string;
  image: string;
  dataAiHint?: string;
  stock: number;
  rarity: ItemRarity;
}

export interface CrateItem extends BaseModel {
  name: string;
  description: string;
  rarity: ItemRarity;
  type: string;
  value: number;
  image: string;
}

export interface InventoryItem extends BaseModel {
  user_id: string;
  item_id: string;
  name: string;
  rarity: ItemRarity;
  type: string;
  value: number;
  image: string;
  equipped?: boolean;
}