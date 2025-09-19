import { supabase, createServerSupabaseClient } from "./supabase";

// Client-side database operations
export function getDb() {
  return supabase;
}

// Server-side database operations (for API routes)
export function getServerDb() {
  return createServerSupabaseClient();
}

// Fetch a single row from a table with a filter (client-side)
export async function getOne(table: string, filter: Record<string, any>) {
  const { data, error } = await supabase
    .from(table)
    .select()
    .match(filter)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Fetch all rows from a table with an optional filter (client-side)
export async function getAll(table: string, filter?: Record<string, any>) {
  let query = supabase.from(table).select();
  if (filter) query = query.match(filter);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Run an insert/update/delete operation (client-side)
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

// Server-side fetch functions (for API routes)
export async function getOneServer(table: string, filter: Record<string, any>) {
  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from(table)
    .select()
    .match(filter)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getAllServer(table: string, filter?: Record<string, any>) {
  const db = createServerSupabaseClient();
  let query = db.from(table).select();
  if (filter) query = query.match(filter);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function runServer(table: string, method: 'insert' | 'update' | 'delete', values: any, filter?: Record<string, any>) {
  const db = createServerSupabaseClient();
  let query;
  if (method === 'insert') {
    query = db.from(table).insert(values);
  } else if (method === 'update') {
    query = db.from(table).update(values).match(filter || {});
  } else if (method === 'delete') {
    query = db.from(table).delete().match(filter || {});
  } else {
    throw new Error('Invalid method');
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}