import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rxamnospcmbtgzptmmxl.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Ensure users table has correct structure
const ensureUsersTable = async () => {
  const { error } = await supabase.rpc('ensure_users_table', {
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY,
        email VARCHAR,
        username VARCHAR,
        avatar_url VARCHAR,
        role VARCHAR DEFAULT 'user',
        coins INTEGER DEFAULT 50,
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        steam_id VARCHAR UNIQUE,
        steam_verified BOOLEAN DEFAULT false,
        account_status VARCHAR DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_login_at TIMESTAMPTZ,
        display_name VARCHAR
      );

      -- Add indexes if they don't exist
      CREATE INDEX IF NOT EXISTS idx_users_steam_id ON users(steam_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      
      -- Add RLS policies
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      
      -- Allow users to read their own data
      DROP POLICY IF EXISTS users_read_own ON users;
      CREATE POLICY users_read_own ON users 
        FOR SELECT 
        TO authenticated 
        USING (auth.uid() = id);
        
      -- Allow users to update their own data
      DROP POLICY IF EXISTS users_update_own ON users;
      CREATE POLICY users_update_own ON users 
        FOR UPDATE 
        TO authenticated 
        USING (auth.uid() = id);
      
      -- Allow service role to manage all users
      DROP POLICY IF EXISTS users_service_role ON users;
      CREATE POLICY users_service_role ON users 
        FOR ALL 
        TO service_role 
        USING (true);
    `
  })

  if (error) {
    console.error('Error ensuring users table:', error)
    throw error
  }
}

// Fix any missing Steam users
const fixMissingSteamUsers = async () => {
  const { data: steamIds, error: steamError } = await supabase
    .from('auth.users')
    .select('id')
    .ilike('id', 'steam-%')

  if (steamError) {
    console.error('Error getting Steam users:', steamError)
    return
  }

  for (const { id } of steamIds) {
    const steamId = id.replace('steam-', '')
    
    // Check if user exists in users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (userError || !user) {
      // Create missing user
      await supabase
        .from('users')
        .insert({
          id: id,
          email: `${steamId}@steam.local`,
          steam_id: steamId,
          steam_verified: true,
          role: 'user',
          coins: 50,
          xp: 0,
          level: 1,
          account_status: 'active',
          created_at: new Date().toISOString(),
          last_login_at: new Date().toISOString()
        })
    }
  }
}

// Run fixes
export const runDatabaseFixes = async () => {
  await ensureUsersTable()
  await fixMissingSteamUsers()
}