const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Database Connection Test');
console.log('URL:', supabaseUrl);
console.log('Service Key exists:', !!supabaseServiceKey);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabase() {
  try {
    console.log('\n📊 Testing database connection...');
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      
      // Check if table exists
      const { data: tables, error: tableError } = await supabase
        .rpc('get_schema_tables');
      
      if (tableError) {
        console.log('📋 Creating users table...');
        await createUsersTable();
      } else {
        console.log('📋 Available tables:', tables);
      }
    } else {
      console.log('✅ Database connection successful');
      console.log('👥 Users table exists with', testData, 'rows');
      
      // Show sample users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username, email, steam_id, created_at')
        .limit(5);
      
      if (!usersError && users) {
        console.log('👤 Sample users:', users);
      }
    }
    
    // Test auth users
    console.log('\n🔐 Testing auth.users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Auth users error:', authError.message);
    } else {
      console.log('✅ Auth users found:', authUsers.users?.length || 0);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

async function createUsersTable() {
  const createTableQuery = `
    -- Create users table if it doesn't exist
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      steam_id TEXT UNIQUE,
      avatar_url TEXT,
      balance INTEGER DEFAULT 1000,
      gems INTEGER DEFAULT 50,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      is_admin BOOLEAN DEFAULT FALSE,
      is_moderator BOOLEAN DEFAULT FALSE,
      is_vip BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_steam_id ON users(steam_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

    -- Enable RLS
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;

    -- Create policies
    DROP POLICY IF EXISTS "Users can view own profile" ON users;
    CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
    
    DROP POLICY IF EXISTS "Users can update own profile" ON users;
    CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createTableQuery });
    if (error) {
      console.error('❌ Failed to create users table:', error.message);
    } else {
      console.log('✅ Users table created successfully');
    }
  } catch (err) {
    console.error('❌ Error creating table:', err.message);
  }
}

testDatabase();