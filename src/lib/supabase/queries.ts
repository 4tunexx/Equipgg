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

export type MissionType = 'daily' | 'weekly' | 'main' | 'event';

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

export interface DBUserMission {
  id: string;
  user_id: string;
  mission_id: string;
  progress: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
  mission?: DBMission; // For joins
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
  xp_reward: number;
  coin_reward: number;
  created_at: string;
}

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
    // Start a transaction
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

  // User updates
  async updateUserCoins(userId: string, amount: number) {
    const { data, error } = await this.supabase
      .from('users')
      .update({ coins: amount })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data as DBUser;
  }

  async updateUserXP(userId: string, xp: number) {
    const { data, error } = await this.supabase
      .from('users')
      .update({ xp: xp })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data as DBUser;
  }

  // Notifications
  async getUserNotifications(userId: string, limit: number = 50) {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }

  async markNotificationsRead(userId: string, notificationIds: string[]) {
    const { error } = await this.supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .in('id', notificationIds);
    
    if (error) throw error;
  }

  // Activity feed
  async addActivity(userId: string, action: string, itemId?: string, xp?: number, icon?: string) {
    const { data, error } = await this.supabase
      .from('activity_feed')
      .insert([{
        user_id: userId,
        action: action,
        item_id: itemId,
        xp: xp,
        icon: icon
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data as DBActivityFeed;
  }

  async getActivityFeed(limit: number = 50) {
    const { data, error } = await this.supabase
      .from('activity_feed')
      .select('*, user:users(*), item:items(*)')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data as DBActivityFeed[];
  }

  // Chat message methods
  async getChatMessages(limit: number = 50, before?: string) {
    let query = this.supabase
      .from('chat_messages')
      .select('*, user:users(id, username, avatar_url, level, role)');
    
    if (before) {
      query = query.lt('created_at', before);
    }
    
    query = query.order('created_at', { ascending: false }).limit(limit);
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async createChatMessage(userId: string, content: string) {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .insert([{
        content,
        user_id: userId,
      }])
      .select('*, user:users(id, username, avatar_url, level, role)')
      .single();
    
    if (error) throw error;
    return data;
  }

  // Forum methods
  async getForumCategories() {
    const { data, error } = await this.supabase
      .from('forum_categories')
      .select('*')
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  async getForumTopics(limit: number = 10) {
    const { data, error } = await this.supabase
      .from('forum_topics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }

  async createForumTopic(userId: string, title: string, content: string, categoryId: string) {
    const { data, error } = await this.supabase
      .from('forum_topics')
      .insert([{
        title,
        content,
        category_id: categoryId,
        author_id: userId,
        reply_count: 0,
        view_count: 0
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Betting methods
  async getUserBets(userId: string, limit: number = 50) {
    const { data, error } = await this.supabase
      .from('user_bets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }

  async placeBet(userId: string, amount: number, gameType: string, betData: any) {
    const { data, error } = await this.supabase
      .from('user_bets')
      .insert([{
        user_id: userId,
        amount,
        game_type: gameType,
        bet_data: betData,
        status: 'pending'
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateBetResult(betId: string, result: 'win' | 'loss', payout?: number) {
    const { data, error } = await this.supabase
      .from('user_bets')
      .update({
        result,
        payout: payout || 0,
        status: 'completed'
      })
      .eq('id', betId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

export const createSupabaseQueries = (supabase: SupabaseClient) => {
  return new SupabaseQueries(supabase);
};