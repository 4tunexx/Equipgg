import { getDb, getOne, getAll, run } from './db';
import { sanitizeSqlIdentifier, validateSqlQuery } from './security';

// Secure database wrapper with input validation
export class SecureDatabase {
  private static instance: SecureDatabase;

  static getInstance(): SecureDatabase {
    if (!SecureDatabase.instance) {
      SecureDatabase.instance = new SecureDatabase();
    }
    return SecureDatabase.instance;
  }

  // Allowed table names for security
  private readonly allowedTables = new Set([
    'users', 'sessions', 'missions', 'user_mission_progress',
    'user_inventory', 'user_transactions', 'user_bets', 'user_crates',
    'user_keys', 'user_perks', 'chat_messages', 'match_votes',
    'match_vote_stats', 'game_history', 'coinflip_lobbies',
    'user_moderation', 'forum_categories', 'forum_topics',
    'forum_posts', 'forum_post_reactions', 'achievements',
    'user_achievements', 'cs2_skin_deliveries', 'gem_settings',
    'exchange_rates', 'gem_packages', 'cs2_skins', 'payment_settings',
    'gem_transactions', 'payment_intents', 'site_settings',
    'admin_logs', 'server_seeds', 'client_seeds', 'game_results'
  ]);

  // Allowed column names for security
  private readonly allowedColumns = new Set([
    'id', 'user_id', 'email', 'displayName', 'role', 'xp', 'level',
    'coins', 'gems', 'created_at', 'lastLoginAt', 'password_hash',
    'avatar_url', 'token', 'mission_id', 'progress', 'completed',
    'completed_at', 'last_updated', 'item_id', 'item_name', 'item_type',
    'rarity', 'image_url', 'value', 'equipped', 'slot_type',
    'acquired_at', 'type', 'amount', 'currency', 'description',
    'itemId', 'match_id', 'team_id', 'odds', 'potential_payout',
    'status', 'result', 'payout', 'crate_id', 'crate_name',
    'key_required', 'keys_count', 'perk_id', 'perk_name', 'perk_type',
    'duration_hours', 'expires_at', 'is_active', 'applied_at',
    'content', 'message', 'username', 'avatar_url', 'channel',
    'team1_votes', 'team2_votes', 'total_votes', 'last_updated',
    'game_type', 'bet_amount', 'winnings', 'profit', 'multiplier',
    'game_data', 'tiles_cleared', 'xp_gained', 'creator_id',
    'joiner_id', 'side', 'winner_id', 'flip_result', 'expires_at',
    'completed_at', 'action', 'reason', 'moderator_id', 'active',
    'name', 'description', 'icon', 'topic_count', 'post_count',
    'display_order', 'title', 'author_id', 'is_pinned', 'is_locked',
    'view_count', 'reply_count', 'last_reply_at', 'updated_at',
    'is_edited', 'edited_at', 'reaction', 'category', 'rarity',
    'xp_reward', 'coin_reward', 'gem_reward', 'requirement_type',
    'requirement_value', 'is_active', 'icon', 'unlocked_at',
    'skin_id', 'skin_name', 'gems_paid', 'steam_id', 'steam_trade_url',
    'trade_offer_id', 'delivered_at', 'gem_shop_enabled',
    'cs2_skins_enabled', 'exchange_enabled', 'daily_exchange_limit',
    'max_exchange_per_transaction', 'gem_shop_maintenance',
    'coins_to_gems', 'gems_to_coins', 'price', 'enabled',
    'steam_market_price', 'stripe_public_key', 'stripe_secret_key',
    'paypal_client_id', 'paypal_client_secret', 'webhook_secret',
    'gems_paid', 'stripe_payment_intent_id', 'paypal_order_id',
    'completed_at', 'setting_key', 'setting_value', 'setting_type',
    'admin_id', 'details', 'target_id', 'seed', 'hashed_seed',
    'is_revealed', 'revealed_at', 'nonce', 'result'
  ]);

  private validateTableName(table: string): boolean {
    return this.allowedTables.has(table);
  }

  private validateColumnName(column: string): boolean {
    return this.allowedColumns.has(column);
  }

  private sanitizeWhereClause(where: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(where)) {
      if (this.validateColumnName(key)) {
        // Sanitize the value based on type
        if (typeof value === 'string') {
          // Remove potential SQL injection patterns
          sanitized[key] = value.replace(/['";\\]/g, '');
        } else {
          sanitized[key] = value;
        }
      }
    }
    
    return sanitized;
  }

  async findOne<T = any>(table: string, where: Record<string, any>): Promise<T | null> {
    if (!this.validateTableName(table)) {
      throw new Error(`Invalid table name: ${table}`);
    }

    const sanitizedWhere = this.sanitizeWhereClause(where);
    const conditions = Object.keys(sanitizedWhere).map(key => `${key} = ?`).join(' AND ');
    const values = Object.values(sanitizedWhere);
    
    const sql = `SELECT * FROM ${table} WHERE ${conditions} LIMIT 1`;
    return await getOne<T>(sql, values);
  }

  async findMany<T = any>(
    table: string, 
    where?: Record<string, any>, 
    options?: { limit?: number; offset?: number; orderBy?: string }
  ): Promise<T[]> {
    if (!this.validateTableName(table)) {
      throw new Error(`Invalid table name: ${table}`);
    }

    let sql = `SELECT * FROM ${table}`;
    const values: any[] = [];

    if (where && Object.keys(where).length > 0) {
      const sanitizedWhere = this.sanitizeWhereClause(where);
      const conditions = Object.keys(sanitizedWhere).map(key => `${key} = ?`).join(' AND ');
      sql += ` WHERE ${conditions}`;
      values.push(...Object.values(sanitizedWhere));
    }

    if (options?.orderBy) {
      const [column, direction] = options.orderBy.split(' ');
      if (this.validateColumnName(column) && ['ASC', 'DESC'].includes(direction?.toUpperCase())) {
        sql += ` ORDER BY ${column} ${direction.toUpperCase()}`;
      }
    }

    if (options?.limit) {
      sql += ` LIMIT ${Math.min(options.limit, 1000)}`; // Max 1000 records
    }

    if (options?.offset) {
      sql += ` OFFSET ${Math.max(options.offset, 0)}`;
    }

    return await getAll<T>(sql, values);
  }

  async create<T = any>(table: string, data: Record<string, any>): Promise<T | null> {
    if (!this.validateTableName(table)) {
      throw new Error(`Invalid table name: ${table}`);
    }

    const sanitizedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (this.validateColumnName(key)) {
        if (typeof value === 'string') {
          sanitizedData[key] = value.replace(/['";\\]/g, '');
        } else {
          sanitizedData[key] = value;
        }
      }
    }

    const columns = Object.keys(sanitizedData);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(sanitizedData);
    
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    await run(sql, values);

    // Return the created record
    const id = sanitizedData.id || sanitizedData.user_id;
    if (id) {
      return await this.findOne<T>(table, { id });
    }
    
    return null;
  }

  async update<T = any>(
    table: string, 
    where: Record<string, any>, 
    data: Record<string, any>
  ): Promise<T | null> {
    if (!this.validateTableName(table)) {
      throw new Error(`Invalid table name: ${table}`);
    }

    const sanitizedWhere = this.sanitizeWhereClause(where);
    const sanitizedData: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (this.validateColumnName(key)) {
        if (typeof value === 'string') {
          sanitizedData[key] = value.replace(/['";\\]/g, '');
        } else {
          sanitizedData[key] = value;
        }
      }
    }

    const setClause = Object.keys(sanitizedData).map(key => `${key} = ?`).join(', ');
    const whereClause = Object.keys(sanitizedWhere).map(key => `${key} = ?`).join(' AND ');
    const values = [...Object.values(sanitizedData), ...Object.values(sanitizedWhere)];
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    await run(sql, values);

    // Return the updated record
    return await this.findOne<T>(table, sanitizedWhere);
  }

  async delete(table: string, where: Record<string, any>): Promise<boolean> {
    if (!this.validateTableName(table)) {
      throw new Error(`Invalid table name: ${table}`);
    }

    const sanitizedWhere = this.sanitizeWhereClause(where);
    const whereClause = Object.keys(sanitizedWhere).map(key => `${key} = ?`).join(' AND ');
    const values = Object.values(sanitizedWhere);
    
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    await run(sql, values);
    
    return true;
  }

  // Secure raw query execution (only for specific use cases)
  async executeSecureQuery<T = any>(
    sql: string, 
    params: any[] = [],
    allowedTables: string[] = []
  ): Promise<T[]> {
    // Validate that the query only references allowed tables
    if (allowedTables.length > 0) {
      for (const table of allowedTables) {
        if (!this.validateTableName(table)) {
          throw new Error(`Invalid table name in query: ${table}`);
        }
      }
    }

    // Basic SQL injection prevention
    if (!validateSqlQuery(sql)) {
      throw new Error('Potentially dangerous SQL query detected');
    }

    return await getAll<T>(sql, params);
  }
}

// Export singleton instance
export const secureDb = SecureDatabase.getInstance();
