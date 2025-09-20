const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectAndFixTable() {
  try {
    console.log('🔍 Inspecting users table structure...');
    
    // Get table schema
    const { data: columns, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'users' });
    
    if (schemaError) {
      console.log('📊 Getting table info via direct query...');
      
      // Try to get a sample record to see the structure
      const { data: sample, error: sampleError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (!sampleError && sample && sample.length > 0) {
        console.log('📋 Current table structure (sample record):');
        console.log(Object.keys(sample[0]));
        console.log('Sample data:', sample[0]);
        
        // The table has: id, email, password_hash, displayname, avatar_url, role, xp, level, coins, gems, created_at, last_login_at
        // But we need: id, username, email, steam_id, avatar_url, balance, gems, xp, level, is_admin, is_moderator, is_vip, created_at, updated_at
        
        console.log('\n🔧 Migrating table structure...');
        await migrateUsersTable();
      }
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

async function migrateUsersTable() {
  const migrationSQL = `
    -- Backup existing data
    CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;
    
    -- Add missing columns
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS username TEXT,
    ADD COLUMN IF NOT EXISTS steam_id TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS balance INTEGER DEFAULT 1000,
    ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_moderator BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    
    -- Migrate data
    UPDATE users SET 
      username = COALESCE(displayname, email, 'user_' || SUBSTRING(id::text, 1, 8)),
      balance = COALESCE(coins, 1000),
      is_admin = (role = 'admin'),
      is_moderator = (role = 'moderator'),
      updated_at = NOW()
    WHERE username IS NULL;
    
    -- Make username NOT NULL and UNIQUE
    UPDATE users SET username = 'user_' || SUBSTRING(id::text, 1, 8) WHERE username IS NULL OR username = '';
    ALTER TABLE users ALTER COLUMN username SET NOT NULL;
    
    -- Add constraints
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_steam_id ON users(steam_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    
    -- Update RLS policies
    DROP POLICY IF EXISTS "Users can view own profile" ON users;
    DROP POLICY IF EXISTS "Users can update own profile" ON users;
    DROP POLICY IF EXISTS "Public profiles viewable" ON users;
    
    CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id::uuid);
    CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id::uuid);
    CREATE POLICY "Public profiles viewable" ON users FOR SELECT USING (true);
    
    -- Enable RLS if not already enabled
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  `;
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error.message);
    } else {
      console.log('✅ Users table migrated successfully');
      
      // Verify migration
      const { data: sample, error: verifyError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (!verifyError && sample) {
        console.log('📋 Migrated table structure:', Object.keys(sample[0]));
      }
    }
  } catch (err) {
    console.error('💥 Migration error:', err.message);
  }
}

inspectAndFixTable();