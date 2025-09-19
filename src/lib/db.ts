import { supabase } from "./supabase";

// Returns the Supabase client instance
export function getDb() {
  return supabase;
}

// Fetch a single row from a table with a filter
export async function getOne(table: string, filter: Record<string, any>) {
  const { data, error } = await supabase
    .from(table)
    .select()
    .match(filter)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Fetch all rows from a table with an optional filter
export async function getAll(table: string, filter?: Record<string, any>) {
  let query = supabase.from(table).select();
  if (filter) query = query.match(filter);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Run an insert/update/delete operation
export async function run(table: string, method: 'insert' | 'update' | 'delete', values: any, filter?: Record<string, any>) {
  let query;
  if (method === 'insert') {
    query = supabase.from(table).insert(values);
  } else if (method === 'update') {
    query = supabase.from(table).update(values).match(filter || {});
  } else if (method === 'delete') {
    query = supabase.from(table).delete().match(filter || {});
  } else {
    throw new Error('Invalid method');
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}