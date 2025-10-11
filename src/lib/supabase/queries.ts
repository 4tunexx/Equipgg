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
  description?: string;
  price: number;
  item_id: string;
  stock: number;
  discount_percentage?: number;
  is_featured?: boolean;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
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
      .from('user_inventory')
      .select('*, item:items(*)')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data as DBInventoryItem[];
  }

  async addItemToInventory(userId: string, itemId: string) {
    const { data, error } = await this.supabase
      .from('user_inventory')
      .insert([{ user_id: userId, item_id: itemId }])
      .select('*, item:items(*)')
      .single();
    
    if (error) throw error;
    return data as DBInventoryItem;
  }

  // Shop queries
  async getShopItems() {
    // Use items table directly - this is the single source of truth managed by admin
    const { data: items, error: itemsError } = await this.supabase
      .from('items')
      .select('*')
      .eq('is_active', true) // Only show active items
      .order('created_at', { ascending: false });
    
    if (itemsError) {
      console.error('Error fetching items:', itemsError);
      throw itemsError;
    }
    
    // Transform items to shop format
    return (items || []).map((item, index) => ({
      id: `shop_${item.id}`,
      name: item.name,
      description: item.description || `${item.type} weapon in ${item.rarity} quality`,
      price: item.coin_price || this.generateItemPrice(item.rarity),
      item_id: item.id,
      stock: item.stock || 999, // Unlimited stock if not specified
      discount_percentage: item.discount_percentage || 0,
      is_featured: item.featured || index < 5, // Use featured flag or first 5 items
      is_active: item.is_active !== false,
      created_at: item.created_at,
      updated_at: item.updated_at,
      item: {
        id: item.id,
        name: item.name,
        type: item.type,
        category: item.category,
        weapon_type: item.weapon_type,
        rarity: item.rarity as Rarity,
        image: item.image,
        description: item.description,
        coin_price: item.coin_price,
        gem_price: item.gem_price,
        is_tradeable: item.is_tradeable,
        is_sellable: item.is_sellable,
        is_equipable: item.is_equipable,
        sell_price: item.sell_price,
        is_active: item.is_active,
        featured: item.featured,
        stock: item.stock,
        purchase_limit: item.purchase_limit,
        discount_percentage: item.discount_percentage,
        original_price: item.original_price,
        data_ai_hint: null,
        created_at: item.created_at,
        updated_at: item.updated_at
      }
    })) as DBShopItem[];
  }
  
  // Helper function to generate prices based on rarity
  private generateItemPrice(rarity: string): number {
    const rarityPrices = {
      'common': 100,
      'uncommon': 250,
      'rare': 500,
      'epic': 1000,
      'legendary': 2500,
      'mythical': 5000
    };
    
    const basePrice = rarityPrices[rarity?.toLowerCase() as keyof typeof rarityPrices] || 100;
    // Add some randomness (±20%)
    const variation = 0.8 + (Math.random() * 0.4);
    return Math.round(basePrice * variation);
  }

  async purchaseShopItem(userId: string, shopItemId: string) {
    // First check if this is a direct item purchase (shop_item_id format)
    const isDirectItem = shopItemId.startsWith('shop_');
    
    if (isDirectItem) {
      // Extract the actual item ID
      const itemId = shopItemId.replace('shop_', '');
      
      // Get the item details
      const { data: item, error: itemError } = await this.supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .single();
      
      if (itemError) throw itemError;
      
      // Generate shop item data for purchase
      const shopItem = {
        id: shopItemId,
        name: item.name,
        description: item.description || `${item.type} weapon`,
        price: this.generateItemPrice(item.rarity),
        item_id: item.id,
        stock: 999,
        item: item
      };
      
      return shopItem as DBShopItem;
    } else {
      // Handle traditional shop_items table purchase
      const { data: shopItem, error: shopError } = await this.supabase
        .from('shop_items')
        .select('*, item:items(*)')
        .eq('id', shopItemId)
        .gt('stock', 0)
        .single();

      if (shopError) throw shopError;

      // Use RPC function if available, otherwise handle manually
      const { error: purchaseError } = await this.supabase
        .rpc('purchase_shop_item', {
          p_user_id: userId,
          p_shop_item_id: shopItemId,
        });

      if (purchaseError) {
        console.log('RPC purchase failed, will handle manually in API');
      }

      return shopItem as DBShopItem;
    }
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
}

export const createSupabaseQueries = (supabase: SupabaseClient) => {
  return new SupabaseQueries(supabase);
};