'use client';

import { createClient, PostgrestError, SupabaseClient } from '@supabase/supabase-js';

// Database types
export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  level: number;
  xp: number;
  coins: number;
  gems: number;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  username: string;
  activity_type: string;
  activity_data?: Record<string, any> | null;
  amount?: number | null;
  item_name?: string | null;
  item_rarity?: string | null;
  game_type?: string | null;
  multiplier?: number | null;
  created_at: string;
}

export interface QueryOptions<T> {
  columns?: string;
  where?: Partial<T>;
  orderBy?: string;
  limit?: number;
}

export interface DatabaseError extends Error {
  code?: string;
  details?: string;
  hint?: string;
  message: string;
}

// Initialize the Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
) as SupabaseClient;

// Helper function to handle Supabase query errors
const handleQueryError = (error: PostgrestError | Error | unknown, context: string): never => {
  console.error(`Error in ${context}:`, error);
  if (error instanceof Error) {
    throw error;
  }
  throw new Error(`Database error in ${context}: ${(error as DatabaseError)?.message || 'Unknown error'}`);
};

type Table = string;
type WhereClause<T> = Partial<T>;

const secureDb = {
  // Execute raw SQL queries
  async raw<T = any>(sql: string, values?: any[]): Promise<T[]> {
    try {
      const { data, error } = await supabase.rpc('execute_sql', { sql, values });

      if (error) {
        throw error;
      }

      return (data || []) as T[];
    } catch (error) {
      throw handleQueryError(error, 'raw');
    }
  },

  // Alias for findOne for compatibility
  async getOne<T = any>(
    table: Table,
    where: WhereClause<T>
  ): Promise<T | null> {
    return this.findOne(table, where);
  },

  async select<T = any>(
    table: Table,
    options: QueryOptions<T> = {}
  ): Promise<T[]> {
    try {
      let query = supabase.from(table).select(options.columns || '*');

      if (options.where) {
        Object.entries(options.where).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key, value);
          }
        });
      }

      if (options.orderBy) {
        query = query.order(options.orderBy);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []) as T[];
    } catch (error) {
      throw handleQueryError(error, 'select');
    }
  },

  async insert<T = any>(
    table: Table,
    data: Partial<T> | Partial<T>[]
  ): Promise<T[]> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select();

      if (error) {
        throw error;
      }

      return (result || []) as T[];
    } catch (error) {
      throw handleQueryError(error, 'insert');
    }
  },

  async update<T = any>(
    table: Table,
    where: WhereClause<T>,
    data: Partial<T>
  ): Promise<T[]> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .match(where)
        .select();

      if (error) {
        throw error;
      }

      return (result || []) as T[];
    } catch (error) {
      throw handleQueryError(error, 'update');
    }
  },

  async upsert<T = any>(
    table: Table,
    data: Partial<T> | Partial<T>[],
    onConflict?: string
  ): Promise<T[]> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .upsert(data, { onConflict })
        .select();

      if (error) {
        throw error;
      }

      return (result || []) as T[];
    } catch (error) {
      throw handleQueryError(error, 'upsert');
    }
  },

  async delete<T = any>(
    table: Table,
    where: WhereClause<T>
  ): Promise<T[]> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .delete()
        .match(where)
        .select();

      if (error) {
        throw error;
      }

      return (result || []) as T[];
    } catch (error) {
      throw handleQueryError(error, 'delete');
    }
  },

  async findOne<T = any>(
    table: Table,
    where: WhereClause<T>
  ): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from(table)
        .select()
        .match(where)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as T;
    } catch (error) {
      if ((error as PostgrestError)?.code === 'PGRST116') {
        return null;
      }
      throw handleQueryError(error, 'findOne');
    }
  },

  // Extra utility methods
  async count<T = any>(
    table: Table,
    where?: WhereClause<T>
  ): Promise<number> {
    try {
      let query = supabase.from(table).select('id', { count: 'exact' });

      if (where) {
        Object.entries(where).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key, value);
          }
        });
      }

      const { count, error } = await query;

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      throw handleQueryError(error, 'count');
    }
  }
};

export default secureDb;