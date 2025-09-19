const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableDetails() {
  console.log('🔍 Checking detailed table structure...\n');

  // Get detailed information about each table
  const tables = [
    'users', 'shop_items', 'user_inventory', 'crates', 'crate_items', 
    'user_achievements', 'achievements', 'missions', 'mission_progress',
    'matches', 'bets', 'user_stats', 'transactions', 'withdrawals',
    'deposits', 'site_settings', 'notifications', 'chat_messages',
    'teams', 'tournaments', 'game_history', 'provably_fair_seeds'
  ];

  for (const tableName of tables) {
    try {
      // Check if table exists and get some basic info
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          console.log(`❌ Table '${tableName}' does not exist`);
        } else {
          console.log(`⚠️  Table '${tableName}' exists but has error:`, error.message);
        }
      } else {
        console.log(`✅ Table '${tableName}' exists and accessible`);
        
        // Try to get row count
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (!countError) {
          console.log(`   📊 Row count: ${count}`);
        }
      }
    } catch (err) {
      console.log(`🔴 Error checking table '${tableName}':`, err.message);
    }
  }

  // Check specific important tables with sample data
  console.log('\n📋 Sample data from key tables:\n');

  // Check users table
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role, created_at')
      .limit(3);
    
    if (!error && users) {
      console.log('👥 Users table sample:');
      console.log(users);
    }
  } catch (err) {
    console.log('Error checking users:', err.message);
  }

  // Check site_settings table
  try {
    const { data: settings, error } = await supabase
      .from('site_settings')
      .select('*')
      .limit(5);
    
    if (!error && settings) {
      console.log('\n⚙️  Site settings:');
      console.log(settings);
    }
  } catch (err) {
    console.log('Error checking site_settings:', err.message);
  }

  // Check missions table
  try {
    const { data: missions, error } = await supabase
      .from('missions')
      .select('id, name, description, xp_reward')
      .limit(3);
    
    if (!error && missions) {
      console.log('\n🎯 Missions table sample:');
      console.log(missions);
    }
  } catch (err) {
    console.log('Error checking missions:', err.message);
  }
}

checkTableDetails()
  .then(() => {
    console.log('\n✅ Database check completed!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });