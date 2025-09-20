const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Steam Columns Migration Script');
console.log('URL:', supabaseUrl);
console.log('Service Key exists:', !!supabaseServiceKey);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('\n📊 Checking current users table schema...');
    
    // First, let's see what columns currently exist
    const { data: columns, error: columnError } = await supabase
      .rpc('get_table_columns', { table_name: 'users' });
    
    if (columnError) {
      console.log('Using alternative method to check schema...');
      
      // Alternative: Try to select specific columns to see what exists
      const { data: testUser, error: testError } = await supabase
        .from('users')
        .select('id, email')
        .limit(1);
      
      if (testError) {
        console.error('❌ Cannot access users table:', testError.message);
        return;
      }
    }
    
    console.log('✅ Users table is accessible');
    
    // Check if steam_id column exists
    console.log('\n🔍 Checking for steam_id column...');
    const { data: steamTest, error: steamError } = await supabase
      .from('users')
      .select('steam_id')
      .limit(1);
    
    if (steamError && steamError.message.includes('column "steam_id" does not exist')) {
      console.log('❌ steam_id column missing - running migration...');
      await addSteamColumns();
    } else if (steamError && steamError.message.includes('column users.steam_id does not exist')) {
      console.log('❌ steam_id column missing - running migration...');
      await addSteamColumns();
    } else if (steamError) {
      console.error('❌ Unexpected error:', steamError.message);
      await addSteamColumns(); // Still try to run migration
    } else {
      console.log('✅ steam_id column already exists');
    }
    
    // Verify all required columns exist
    await verifyUserSchema();
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

async function addSteamColumns() {
  console.log('\n🚀 Adding Steam authentication columns...');
  
  try {
    // Method 1: Using a simple INSERT/UPDATE to trigger schema changes
    // First, let's see if we can access the table structure
    const { data: tableInfo, error: infoError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'users');
    
    console.log('Current table access:', !infoError);
    
    // Since we can't execute DDL directly via Supabase client,
    // we need to use the database connection more directly
    console.log('\n💡 Note: You need to execute the SQL migration manually in your Supabase dashboard.');
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log('\n--- COPY AND PASTE THIS SQL INTO SUPABASE SQL EDITOR ---');
    
    const fullMigrationSQL = `
-- Add missing Steam authentication columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS steam_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS steam_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS steam_trade_url TEXT;

-- Add other required columns if missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 1000;
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS matches_played INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_steam_id ON users(steam_id) WHERE steam_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_steam_verified ON users(steam_verified) WHERE steam_verified = true;
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);

-- Add unique constraint for steam_id
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS unique_steam_id UNIQUE(steam_id);

-- Update existing users with default values
UPDATE users 
SET 
  steam_verified = COALESCE(steam_verified, false),
  account_status = COALESCE(account_status, 'pending'),
  coins = COALESCE(coins, 1000),
  xp = COALESCE(xp, 0),
  level = COALESCE(level, 1),
  wins = COALESCE(wins, 0),
  matches_played = COALESCE(matches_played, 0)
WHERE 
  steam_verified IS NULL 
  OR account_status IS NULL 
  OR coins IS NULL 
  OR xp IS NULL 
  OR level IS NULL 
  OR wins IS NULL 
  OR matches_played IS NULL;
`;
    
    console.log(fullMigrationSQL);
    console.log('\n--- END OF SQL TO COPY ---\n');
    
    console.log('📝 Steps to fix the database:');
    console.log('1. Go to https://supabase.com/dashboard/project/[your-project]/sql');
    console.log('2. Copy and paste the SQL above into the SQL Editor');
    console.log('3. Click "Run" to execute the migration');
    console.log('4. Return here and press Enter to verify the fix');
    
    // Wait for user confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      rl.question('\nPress Enter after running the SQL migration in Supabase dashboard...', () => {
        rl.close();
        resolve();
      });
    });
    
  } catch (error) {
    console.error('❌ Error preparing migration:', error.message);
  }
}

async function verifyUserSchema() {
  console.log('\n✅ Verifying final schema...');
  
  const requiredColumns = [
    'id', 'email', 'steam_id', 'steam_verified', 'account_status', 
    'username', 'avatar', 'coins', 'xp', 'level', 'wins', 'matches_played'
  ];
  
  const missingColumns = [];
  
  for (const column of requiredColumns) {
    try {
      const { error } = await supabase
        .from('users')
        .select(column)
        .limit(1);
      
      if (error && error.message.includes(`column "${column}" does not exist`)) {
        missingColumns.push(column);
      }
    } catch (error) {
      console.log(`Could not verify column ${column}:`, error.message);
    }
  }
  
  if (missingColumns.length === 0) {
    console.log('🎉 All required columns exist!');
    
    // Test Steam authentication query
    console.log('\n🧪 Testing Steam lookup query...');
    const { data: steamTest, error: steamTestError } = await supabase
      .from('users')
      .select('id, email, steam_id')
      .eq('steam_id', 'test_steam_id')
      .limit(1);
    
    if (steamTestError) {
      console.error('❌ Steam lookup test failed:', steamTestError.message);
    } else {
      console.log('✅ Steam lookup query works! Migration successful!');
    }
    
  } else {
    console.log('❌ Still missing columns:', missingColumns.join(', '));
  }
}

// Run the migration
runMigration();