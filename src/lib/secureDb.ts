'use client';

import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { supabase as publicSupabase } from './supabase';

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
  activity_data?: Record<string, unknown> | null;
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

// Use the shared guarded public Supabase client exported from `src/lib/supabase`.
// That module returns a helpful stub when env vars are missing instead of
// throwing at import time which would break Next.js builds.
const supabase = (publicSupabase as unknown) as SupabaseClient;

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
  async raw<T = Record<string, unknown>>(sql: string, values?: unknown[]): Promise<T[]> {
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
  async getOne<T = Record<string, unknown>>(
    table: Table,
    where: WhereClause<T>
  ): Promise<T | null> {
    return this.findOne(table, where);
  },

  async select<T = Record<string, unknown>>(
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

  async insert<T = Record<string, unknown>>(
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

  async update<T = Record<string, unknown>>(
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

  async upsert<T = Record<string, unknown>>(
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

  async delete<T = Record<string, unknown>>(
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

  async findOne<T = Record<string, unknown>>(
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
  async count<T = Record<string, unknown>>(
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