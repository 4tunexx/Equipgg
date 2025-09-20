const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUsersTable() {
  try {
    console.log('🔧 Checking and fixing users table...');
    
    // First, let's try to select from users table
    const { data: users, error: selectError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (selectError) {
      console.error('❌ Error selecting from users:', selectError.message);
      console.log('🛠️ Creating users table...');
      await createUsersTable();
    } else {
      console.log('✅ Users table accessible');
      console.log('👥 Current users:', users?.length || 0);
      if (users && users.length > 0) {
        console.log('Sample user:', users[0]);
      }
    }
    
    // Get auth users and sync them
    console.log('\n🔄 Syncing auth.users to users table...');
    const { data: authResult, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Failed to get auth users:', authError.message);
      return;
    }
    
    const authUsers = authResult.users || [];
    console.log(`📋 Found ${authUsers.length} auth users to sync`);
    
    for (const authUser of authUsers) {
      // Check if user exists in users table
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .single();
      
      if (checkError && checkError.code === 'PGRST116') {
        // User doesn't exist, create them
        console.log(`➕ Creating user for ${authUser.email || authUser.id}`);
        
        const userData = {
          id: authUser.id,
          email: authUser.email,
          username: authUser.user_metadata?.username || authUser.email?.split('@')[0] || `user_${authUser.id.substring(0, 8)}`,
          steam_id: authUser.user_metadata?.steam_id || null,
          avatar_url: authUser.user_metadata?.avatar_url || null,
          balance: 1000,
          gems: 50,
          xp: 0,
          level: 1,
          is_admin: false,
          is_moderator: false,
          is_vip: false
        };
        
        const { error: insertError } = await supabase
          .from('users')
          .insert([userData]);
        
        if (insertError) {
          console.error(`❌ Failed to create user ${userData.username}:`, insertError.message);
        } else {
          console.log(`✅ Created user ${userData.username}`);
        }
      } else if (!checkError) {
        console.log(`✅ User ${authUser.email || authUser.id} already exists`);
      } else {
        console.error(`❌ Error checking user ${authUser.id}:`, checkError.message);
      }
    }
    
    // Final count
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n✅ Sync complete. Users table now has ${count} users.`);
    
  } catch (error) {
    console.error('💥 Failed to fix users table:', error.message);
  }
}

async function createUsersTable() {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Drop and recreate users table
      DROP TABLE IF EXISTS users CASCADE;
      
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
      CREATE INDEX idx_users_username ON users(username);
      CREATE INDEX idx_users_steam_id ON users(steam_id);
      CREATE INDEX idx_users_email ON users(email);

      -- Enable RLS
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;

      -- Create policies
      CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
      CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
      CREATE POLICY "Public profiles viewable" ON users FOR SELECT USING (true);
    `
  });
  
  if (error) {
    console.error('❌ Failed to create users table:', error.message);
    throw error;
  } else {
    console.log('✅ Users table created successfully');
  }
}

fixUsersTable();