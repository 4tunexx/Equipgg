/**
 * COMPLETE TRADING SYSTEM WITH ESCROW
 * Full P2P trading with security, escrow, and fraud prevention
 */

import { createServerSupabaseClient } from '../supabase';
import { broadcastNotification } from '../supabase/realtime-client';

export interface TradeOffer {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_items: TradeItem[];
  receiver_items: TradeItem[];
  sender_coins?: number;
  receiver_coins?: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed' | 'disputed';
  message?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface TradeItem {
  item_id: string;
  inventory_id: string;
  quantity: number;
  item_name: string;
  item_image: string;
  rarity: string;
  value: number;
}

export class TradingService {
  private readonly TRADE_EXPIRY_HOURS = 24;
  private readonly MAX_ITEMS_PER_TRADE = 20;
  private readonly TRADE_COOLDOWN_MINUTES = 5;
  private readonly ESCROW_HOLD_DAYS = 3;

  /**
   * Create a new trade offer
   */
  async createTradeOffer(
    senderId: string,
    receiverId: string,
    senderItems: string[],
    receiverItems: string[],
    senderCoins: number = 0,
    receiverCoins: number = 0,
    message?: string
  ): Promise<TradeOffer> {
    const supabase = createServerSupabaseClient();

    // Validate users
    if (senderId === receiverId) {
      throw new Error('Cannot trade with yourself');
    }

    // Check trade cooldown
    const lastTrade = await this.getLastUserTrade(senderId);
    if (lastTrade) {
      const cooldownEnd = new Date(lastTrade.created_at);
      cooldownEnd.setMinutes(cooldownEnd.getMinutes() + this.TRADE_COOLDOWN_MINUTES);
      
      if (new Date() < cooldownEnd) {
        throw new Error(`Trade cooldown active. Please wait ${Math.ceil((cooldownEnd.getTime() - Date.now()) / 1000 / 60)} minutes`);
      }
    }

    // Check if users are not trade banned
    const [sender, receiver] = await Promise.all([
      this.getUserTradeStatus(senderId),
      this.getUserTradeStatus(receiverId),
    ]);

    if (sender.trade_banned || receiver.trade_banned) {
      throw new Error('One or more users are trade banned');
    }

    // Validate items ownership
    const senderInventory = await this.validateItemsOwnership(senderId, senderItems);
    const receiverWantedItems = await this.getItemDetails(receiverItems);

    // Validate coins
    if (senderCoins > 0) {
      const { data: senderData } = await supabase
        .from('users')
        .select('coins')
        .eq('id', senderId)
        .single();
      
      if (!senderData || senderData.coins < senderCoins) {
        throw new Error('Insufficient coins');
      }
    }

    // Calculate trade values for fairness check
    const senderValue = this.calculateTradeValue(senderInventory, senderCoins);
    const receiverValue = this.calculateTradeValue(receiverWantedItems, receiverCoins);
    
    // Warn if trade seems unfair (>50% difference)
    const valueDifference = Math.abs(senderValue - receiverValue) / Math.max(senderValue, receiverValue);
    const isSuspicious = valueDifference > 0.5;

    // Create trade offer
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.TRADE_EXPIRY_HOURS);

    const { data: trade, error } = await supabase
      .from('trade_offers')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        status: 'pending',
        message: message,
        expires_at: expiresAt.toISOString(),
        sender_coins: senderCoins,
        receiver_coins: receiverCoins,
        sender_value: senderValue,
        receiver_value: receiverValue,
        is_suspicious: isSuspicious,
      })
      .select()
      .single();

    if (error || !trade) {
      throw new Error('Failed to create trade offer');
    }

    // Add items to trade
    const tradeItems = [
      ...senderInventory.map(item => ({
        trade_id: trade.id,
        user_id: senderId,
        inventory_id: item.id,
        item_id: item.item_id,
        quantity: item.quantity || 1,
        is_sender: true,
      })),
      ...receiverWantedItems.map(item => ({
        trade_id: trade.id,
        user_id: receiverId,
        inventory_id: null,
        item_id: item.id,
        quantity: 1,
        is_sender: false,
      })),
    ];

    if (tradeItems.length > 0) {
      await supabase.from('trade_items').insert(tradeItems);
    }

    // Lock sender's items in escrow
    await this.lockItemsInEscrow(senderId, senderItems);
    if (senderCoins > 0) {
      await this.lockCoinsInEscrow(senderId, senderCoins);
    }

    // Notify receiver
    await broadcastNotification(receiverId, {
      title: 'New Trade Offer! 📦',
      message: `You have received a trade offer from ${sender.displayName || 'a user'}`,
      type: 'trade',
      action_url: `/dashboard/trading/${trade.id}`,
    });

    return this.getTradeOffer(trade.id);
  }

  /**
   * Accept a trade offer
   */
  async acceptTradeOffer(tradeId: string, userId: string): Promise<boolean> {
    const supabase = createServerSupabaseClient();
    
    const trade = await this.getTradeOffer(tradeId);
    
    if (!trade) {
      throw new Error('Trade not found');
    }

    if (trade.receiver_id !== userId) {
      throw new Error('You cannot accept this trade');
    }

    if (trade.status !== 'pending') {
      throw new Error('Trade is no longer pending');
    }

    if (new Date(trade.expires_at) < new Date()) {
      throw new Error('Trade has expired');
    }

    // Begin transaction
    try {
      // Lock receiver's items and coins
      const receiverItems = trade.receiver_items.map(i => i.inventory_id);
      if (receiverItems.length > 0) {
        await this.lockItemsInEscrow(trade.receiver_id, receiverItems);
      }
      if (trade.receiver_coins && trade.receiver_coins > 0) {
        await this.lockCoinsInEscrow(trade.receiver_id, trade.receiver_coins);
      }

      // Update trade status to accepted
      await supabase
        .from('trade_offers')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', tradeId);

      // If no escrow hold required (both users verified), complete immediately
      const [senderVerified, receiverVerified] = await Promise.all([
        this.isUserVerified(trade.sender_id),
        this.isUserVerified(trade.receiver_id),
      ]);

      if (senderVerified && receiverVerified) {
        await this.completeTrade(tradeId);
      } else {
        // Schedule escrow release after hold period
        const releaseDate = new Date();
        releaseDate.setDate(releaseDate.getDate() + this.ESCROW_HOLD_DAYS);
        
        await supabase.from('escrow_releases').insert({
          trade_id: tradeId,
          release_date: releaseDate.toISOString(),
          status: 'pending',
        });

        // Notify both users about escrow
        await Promise.all([
          broadcastNotification(trade.sender_id, {
            title: 'Trade Accepted! ⏳',
            message: `Your trade has been accepted. Items will be exchanged in ${this.ESCROW_HOLD_DAYS} days.`,
            type: 'trade',
          }),
          broadcastNotification(trade.receiver_id, {
            title: 'Trade Accepted! ⏳',
            message: `Trade accepted. Items will be exchanged in ${this.ESCROW_HOLD_DAYS} days.`,
            type: 'trade',
          }),
        ]);
      }

      return true;
    } catch (error) {
      // Rollback on error
      await supabase
        .from('trade_offers')
        .update({ status: 'pending' })
        .eq('id', tradeId);
      
      throw error;
    }
  }

  /**
   * Complete the trade (transfer items)
   */
  private async completeTrade(tradeId: string): Promise<void> {
    const supabase = createServerSupabaseClient();
    const trade = await this.getTradeOffer(tradeId);

    if (!trade) return;

    try {
      // Transfer sender items to receiver
      for (const item of trade.sender_items) {
        await supabase
          .from('user_inventory')
          .update({ 
            user_id: trade.receiver_id,
            traded_at: new Date().toISOString(),
          })
          .eq('id', item.inventory_id);
      }

      // Transfer receiver items to sender
      for (const item of trade.receiver_items) {
        await supabase
          .from('user_inventory')
          .update({ 
            user_id: trade.sender_id,
            traded_at: new Date().toISOString(),
          })
          .eq('id', item.inventory_id);
      }

      // Transfer coins
      if (trade.sender_coins && trade.sender_coins > 0) {
        await this.transferCoins(trade.sender_id, trade.receiver_id, trade.sender_coins);
      }
      if (trade.receiver_coins && trade.receiver_coins > 0) {
        await this.transferCoins(trade.receiver_id, trade.sender_id, trade.receiver_coins);
      }

      // Update trade status
      await supabase
        .from('trade_offers')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', tradeId);

      // Release escrow
      await supabase
        .from('escrow_releases')
        .update({ status: 'completed' })
        .eq('trade_id', tradeId);

      // Notify users
      await Promise.all([
        broadcastNotification(trade.sender_id, {
          title: 'Trade Completed! ✅',
          message: 'Your trade has been successfully completed.',
          type: 'trade',
        }),
        broadcastNotification(trade.receiver_id, {
          title: 'Trade Completed! ✅',
          message: 'Your trade has been successfully completed.',
          type: 'trade',
        }),
      ]);

      // Update trade statistics
      await this.updateTradeStatistics(trade.sender_id);
      await this.updateTradeStatistics(trade.receiver_id);

    } catch (error) {
      // Mark trade as disputed on error
      await supabase
        .from('trade_offers')
        .update({ status: 'disputed' })
        .eq('id', tradeId);
      
      throw error;
    }
  }

  /**
   * Reject a trade offer
   */
  async rejectTradeOffer(tradeId: string, userId: string): Promise<boolean> {
    const supabase = createServerSupabaseClient();
    const trade = await this.getTradeOffer(tradeId);

    if (!trade) {
      throw new Error('Trade not found');
    }

    if (trade.receiver_id !== userId) {
      throw new Error('You cannot reject this trade');
    }

    if (trade.status !== 'pending') {
      throw new Error('Trade is no longer pending');
    }

    // Update status
    await supabase
      .from('trade_offers')
      .update({ 
        status: 'rejected',
        rejected_at: new Date().toISOString(),
      })
      .eq('id', tradeId);

    // Release sender's escrow
    await this.releaseEscrow(trade.sender_id, trade.sender_items.map(i => i.inventory_id));
    if (trade.sender_coins && trade.sender_coins > 0) {
      await this.releaseCoinsFromEscrow(trade.sender_id, trade.sender_coins);
    }

    // Notify sender
    await broadcastNotification(trade.sender_id, {
      title: 'Trade Rejected ❌',
      message: 'Your trade offer has been rejected.',
      type: 'trade',
    });

    return true;
  }

  /**
   * Cancel a trade offer
   */
  async cancelTradeOffer(tradeId: string, userId: string): Promise<boolean> {
    const supabase = createServerSupabaseClient();
    const trade = await this.getTradeOffer(tradeId);

    if (!trade) {
      throw new Error('Trade not found');
    }

    if (trade.sender_id !== userId) {
      throw new Error('You cannot cancel this trade');
    }

    if (trade.status !== 'pending') {
      throw new Error('Trade is no longer pending');
    }

    // Update status
    await supabase
      .from('trade_offers')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', tradeId);

    // Release sender's escrow
    await this.releaseEscrow(trade.sender_id, trade.sender_items.map(i => i.inventory_id));
    if (trade.sender_coins && trade.sender_coins > 0) {
      await this.releaseCoinsFromEscrow(trade.sender_id, trade.sender_coins);
    }

    return true;
  }

  /**
   * Get trade offer details
   */
  async getTradeOffer(tradeId: string): Promise<TradeOffer> {
    const supabase = createServerSupabaseClient();
    
    const { data: trade } = await supabase
      .from('trade_offers')
      .select(`
        *,
        sender:users!sender_id(id, displayName, avatar_url),
        receiver:users!receiver_id(id, displayName, avatar_url),
        trade_items(*)
      `)
      .eq('id', tradeId)
      .single();

    if (!trade) {
      throw new Error('Trade not found');
    }

    // Format trade items
    const senderItems = trade.trade_items
      .filter((i: any) => i.is_sender)
      .map((i: any) => ({
        item_id: i.item_id,
        inventory_id: i.inventory_id,
        quantity: i.quantity,
        item_name: i.item_name,
        item_image: i.item_image,
        rarity: i.rarity,
        value: i.value,
      }));

    const receiverItems = trade.trade_items
      .filter((i: any) => !i.is_sender)
      .map((i: any) => ({
        item_id: i.item_id,
        inventory_id: i.inventory_id,
        quantity: i.quantity,
        item_name: i.item_name,
        item_image: i.item_image,
        rarity: i.rarity,
        value: i.value,
      }));

    return {
      ...trade,
      sender_items: senderItems,
      receiver_items: receiverItems,
    };
  }

  /**
   * Get user's trade history
   */
  async getUserTradeHistory(userId: string, limit: number = 50): Promise<TradeOffer[]> {
    const supabase = createServerSupabaseClient();
    
    const { data: trades } = await supabase
      .from('trade_offers')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    return trades || [];
  }

  /**
   * Helper: Lock items in escrow
   */
  private async lockItemsInEscrow(userId: string, itemIds: string[]): Promise<void> {
    const supabase = createServerSupabaseClient();
    
    await supabase
      .from('user_inventory')
      .update({ 
        in_escrow: true,
        escrow_locked_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .in('id', itemIds);
  }

  /**
   * Helper: Release items from escrow
   */
  private async releaseEscrow(userId: string, itemIds: string[]): Promise<void> {
    const supabase = createServerSupabaseClient();
    
    await supabase
      .from('user_inventory')
      .update({ 
        in_escrow: false,
        escrow_locked_at: null,
      })
      .eq('user_id', userId)
      .in('id', itemIds);
  }

  /**
   * Helper: Lock coins in escrow
   */
  private async lockCoinsInEscrow(userId: string, amount: number): Promise<void> {
    const supabase = createServerSupabaseClient();
    
    const { data: user } = await supabase
      .from('users')
      .select('coins, coins_in_escrow')
      .eq('id', userId)
      .single();

    if (user) {
      await supabase
        .from('users')
        .update({ 
          coins: user.coins - amount,
          coins_in_escrow: (user.coins_in_escrow || 0) + amount,
        })
        .eq('id', userId);
    }
  }

  /**
   * Helper: Release coins from escrow
   */
  private async releaseCoinsFromEscrow(userId: string, amount: number): Promise<void> {
    const supabase = createServerSupabaseClient();
    
    const { data: user } = await supabase
      .from('users')
      .select('coins, coins_in_escrow')
      .eq('id', userId)
      .single();

    if (user) {
      await supabase
        .from('users')
        .update({ 
          coins: user.coins + amount,
          coins_in_escrow: Math.max(0, (user.coins_in_escrow || 0) - amount),
        })
        .eq('id', userId);
    }
  }

  /**
   * Helper: Transfer coins between users
   */
  private async transferCoins(fromUserId: string, toUserId: string, amount: number): Promise<void> {
    const supabase = createServerSupabaseClient();
    
    // Deduct from escrow
    const { data: fromUser } = await supabase
      .from('users')
      .select('coins_in_escrow')
      .eq('id', fromUserId)
      .single();

    if (fromUser) {
      await supabase
        .from('users')
        .update({ 
          coins_in_escrow: Math.max(0, (fromUser.coins_in_escrow || 0) - amount),
        })
        .eq('id', fromUserId);
    }

    // Add to receiver
    const { data: toUser } = await supabase
      .from('users')
      .select('coins')
      .eq('id', toUserId)
      .single();

    if (toUser) {
      await supabase
        .from('users')
        .update({ 
          coins: toUser.coins + amount,
        })
        .eq('id', toUserId);
    }
  }

  /**
   * Helper: Validate items ownership
   */
  private async validateItemsOwnership(userId: string, itemIds: string[]): Promise<any[]> {
    const supabase = createServerSupabaseClient();
    
    const { data: items } = await supabase
      .from('user_inventory')
      .select('*, item:items(*)')
      .eq('user_id', userId)
      .in('id', itemIds)
      .eq('in_escrow', false);

    if (!items || items.length !== itemIds.length) {
      throw new Error('Some items are not available for trade');
    }

    return items;
  }

  /**
   * Helper: Get item details
   */
  private async getItemDetails(itemIds: string[]): Promise<any[]> {
    const supabase = createServerSupabaseClient();
    
    const { data: items } = await supabase
      .from('items')
      .select('*')
      .in('id', itemIds);

    return items || [];
  }

  /**
   * Helper: Calculate trade value
   */
  private calculateTradeValue(items: any[], coins: number = 0): number {
    const itemValue = items.reduce((total, item) => {
      const baseValue = item.value || this.getItemValueByRarity(item.rarity);
      return total + (baseValue * (item.quantity || 1));
    }, 0);

    return itemValue + coins;
  }

  /**
   * Helper: Get item value by rarity
   */
  private getItemValueByRarity(rarity: string): number {
    const rarityValues: { [key: string]: number } = {
      'common': 10,
      'uncommon': 25,
      'rare': 100,
      'epic': 500,
      'legendary': 2500,
      'mythical': 10000,
    };

    return rarityValues[rarity.toLowerCase()] || 10;
  }

  /**
   * Helper: Check if user is verified
   */
  private async isUserVerified(userId: string): Promise<boolean> {
    const supabase = createServerSupabaseClient();
    
    const { data: user } = await supabase
      .from('users')
      .select('steamVerified, email_verified, created_at')
      .eq('id', userId)
      .single();

    if (!user) return false;

    // User is verified if:
    // 1. Steam is verified
    // 2. Account is older than 7 days
    // 3. Has completed at least 5 trades
    const accountAge = Date.now() - new Date(user.created_at).getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    if (!user.steamVerified || accountAge < sevenDays) {
      return false;
    }

    const { count } = await supabase
      .from('trade_offers')
      .select('id', { count: 'exact' })
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'completed');

    return (count || 0) >= 5;
  }

  /**
   * Helper: Get user trade status
   */
  private async getUserTradeStatus(userId: string): Promise<any> {
    const supabase = createServerSupabaseClient();
    
    const { data: user } = await supabase
      .from('users')
      .select('id, displayName, avatar_url, trade_banned, trade_ban_reason')
      .eq('id', userId)
      .single();

    return user || { trade_banned: false };
  }

  /**
   * Helper: Get last user trade
   */
  private async getLastUserTrade(userId: string): Promise<any> {
    const supabase = createServerSupabaseClient();
    
    const { data: trade } = await supabase
      .from('trade_offers')
      .select('*')
      .eq('sender_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return trade;
  }

  /**
   * Helper: Update trade statistics
   */
  private async updateTradeStatistics(userId: string): Promise<void> {
    const supabase = createServerSupabaseClient();
    
    const { count } = await supabase
      .from('trade_offers')
      .select('id', { count: 'exact' })
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'completed');

    await supabase
      .from('users')
      .update({ 
        total_trades: count || 0,
        last_trade_at: new Date().toISOString(),
      })
      .eq('id', userId);
  }
}

// Export singleton
export const tradingService = new TradingService();
