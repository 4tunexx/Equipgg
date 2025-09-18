import { SupabaseClient } from '@supabase/supabase-js';

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
export type MatchStatus = 'Upcoming' | 'Live' | 'Finished';

export interface DBUser {
  id: string;
  steam_id: string | null;
  username: string;
  avatar: string | null;
  coins: number;
  xp: number;
  level: number;
  wins: number;
  matches_played: number;
  created_at: string;
  updated_at: string;
}

export interface DBItem {
  id: string;
  name: string;
  type: string;
  rarity: Rarity;
  image: string | null;
  data_ai_hint: string | null;
  created_at: string;
}

export interface DBInventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  equipped: boolean;
  created_at: string;
  item?: DBItem; // For joins
}

export type GameType = 'arcade' | 'crash' | 'coinflip' | 'plinko' | 'sweeper' | 'betting' | 'trading';

export interface DBAchievement {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  xp_reward: number;
  game_type: GameType;
  condition?: string;
  requirement_value?: number;
  created_at: string;
  updated_at?: string;
}

export interface DBUserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  created_at: string;
  unlocked_at: string | null;
  achievement: DBAchievement | null;
  progress: number | null;
}

export interface DBCrate {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  created_at: string;
}

export interface DBCrateItem {
  id: string;
  crate_id: string;
  item_id: string;
  drop_chance: number;
  created_at: string;
  item?: DBItem; // For joins
}

export interface DBMission {
  id: string;
  name: string;
  description: string;
  type: MissionType;
  progress_required: number;
  xp_reward: number;
  coin_reward: number;
  created_at: string;
  updated_at: string;
}

export type MissionType = 'daily' | 'weekly' | 'main' | 'event';

export interface DBUserMission {
  id: string;
  user_id: string;
  mission_id: string;
  progress: number;
  completed: boolean;
  expires_at: string | null;
  created_at: string;
  mission?: DBMission; // For joins
}

export interface DBTeam {
  id: string;
  name: string;
  logo: string | null;
  data_ai_hint: string | null;
  created_at: string;
}

export interface DBMatch {
  id: string;
  team1_id: string;
  team2_id: string;
  odds1: number | null;
  odds2: number | null;
  tournament: string | null;
  event_name: string | null;
  start_time: string | null;
  map: string | null;
  status: MatchStatus;
  created_at: string;
  updated_at: string;
  team1?: DBTeam; // For joins
  team2?: DBTeam; // For joins
}

export interface DBShopItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  item_id: string;
  stock: number;
  created_at: string;
  item?: DBItem; // For joins
}

export interface DBActivityFeed {
  id: string;
  user_id: string;
  action: string;
  item_id: string | null;
  xp: number | null;
  icon: string | null;
  created_at: string;
  user?: DBUser; // For joins
  item?: DBItem; // For joins
}

export class SupabaseQueries {
  constructor(private supabase: SupabaseClient) {}

  // Achievement queries
  async completeAchievement(userId: string, achievementId: string) {
    const { error } = await this.supabase
      .from('user_achievements')
      .update({
        unlocked_at: new Date().toISOString(),
        progress: 100
      })
      .eq('user_id', userId)
      .eq('achievement_id', achievementId);

    if (error) throw error;
  }

  async getUserAchievements(userId: string) {
    const { data, error } = await this.supabase
      .from('user_achievements')
      .select('*, achievement:achievements(*)')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data as DBUserAchievement[];
  }

  async unlockAchievement(userId: string, achievementId: string) {
    const { data, error } = await this.supabase
      .from('user_achievements')
      .insert([{ user_id: userId, achievement_id: achievementId }])
      .select('*, achievement:achievements(*)')
      .single();
    
    if (error) throw error;
    return data as DBUserAchievement;
  }

  // User queries
  async getUserById(id: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as DBUser;
  }

  async getUserByUsername(username: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error) throw error;
    return data as DBUser;
  }

  // Item queries
  async getItemById(id: string) {
    const { data, error } = await this.supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as DBItem;
  }

  async getItemsByType(type: string) {
    const { data, error } = await this.supabase
      .from('items')
      .select('*')
      .eq('type', type);
    
    if (error) throw error;
    return data as DBItem[];
  }

  // Inventory queries
  async getUserInventory(userId: string) {
    const { data, error } = await this.supabase
      .from('inventory_items')
      .select('*, item:items(*)')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data as DBInventoryItem[];
  }

  async addItemToInventory(userId: string, itemId: string) {
    const { data, error } = await this.supabase
      .from('inventory_items')
      .insert([{ user_id: userId, item_id: itemId }])
      .select('*, item:items(*)')
      .single();
    
    if (error) throw error;
    return data as DBInventoryItem;
  }

  // Crate queries
  async getAllCrates() {
    const { data, error } = await this.supabase
      .from('crates')
      .select('*');
    
    if (error) throw error;
    return data as DBCrate[];
  }

  async getCrateItems(crateId: string) {
    const { data, error } = await this.supabase
      .from('crate_items')
      .select('*, item:items(*)')
      .eq('crate_id', crateId);
    
    if (error) throw error;
    return data as DBCrateItem[];
  }

  // Mission queries
  async getUserMissions(userId: string) {
    const { data, error } = await this.supabase
      .from('user_missions')
      .select('*, mission:missions(*)')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString());
    
    if (error) throw error;
    return data as DBUserMission[];
  }

  async completeMission(userId: string, missionId: string) {
    const { data, error } = await this.supabase
      .from('user_missions')
      .update({ completed: true })
      .eq('user_id', userId)
      .eq('mission_id', missionId)
      .select('*, mission:missions(*)')
      .single();
    
    if (error) throw error;
    return data as DBUserMission;
  }

  // Match queries
  async getUpcomingMatches() {
    const { data, error } = await this.supabase
      .from('matches')
      .select('*, team1:teams(*), team2:teams(*)')
      .eq('status', 'Upcoming')
      .gt('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });
    
    if (error) throw error;
    return data as DBMatch[];
  }

  async getLiveMatches() {
    const { data, error } = await this.supabase
      .from('matches')
      .select('*, team1:teams(*), team2:teams(*)')
      .eq('status', 'Live')
      .order('start_time', { ascending: true });
    
    if (error) throw error;
    return data as DBMatch[];
  }

  // Shop queries
  async getShopItems() {
    const { data, error } = await this.supabase
      .from('shop_items')
      .select('*, item:items(*)')
      .gt('stock', 0);
    
    if (error) throw error;
    return data as DBShopItem[];
  }

  async purchaseShopItem(userId: string, shopItemId: string) {
    const { data: shopItem, error: shopError } = await this.supabase
      .from('shop_items')
      .select('*')
      .eq('id', shopItemId)
      .gt('stock', 0)
      .single();

    if (shopError) throw shopError;

    const { error: purchaseError } = await this.supabase
      .rpc('purchase_shop_item', {
        p_user_id: userId,
        p_shop_item_id: shopItemId,
      });

    if (purchaseError) throw purchaseError;

    return shopItem as DBShopItem;
  }

  // Activity feed queries
  async getUserActivityFeed(userId: string) {
    const { data, error } = await this.supabase
      .from('activity_feed')
      .select('*, user:users(username), item:items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return data as DBActivityFeed[];
  }

  async addActivityFeedEntry(entry: Omit<DBActivityFeed, 'id' | 'created_at'>) {
    const { data, error } = await this.supabase
      .from('activity_feed')
      .insert([entry])
      .select('*, user:users(username), item:items(*)')
      .single();
    
    if (error) throw error;
    return data as DBActivityFeed;
  }
}

export const createSupabaseQueries = (supabase: SupabaseClient) => {
  return new SupabaseQueries(supabase);
};