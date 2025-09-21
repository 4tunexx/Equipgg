const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Expected tables based on the website code
const expectedTables = [
  'users',
  'items', 
  'shop_items',
  'user_inventory',
  'crates',
  'crate_items',
  'matches',
  'user_bets',
  'bets',
  'missions',
  'user_missions',
  'achievements',
  'user_achievements',
  'activity_feed',
  'notifications',
  'game_sessions',
  'flash_sales',
  'user_settings',
  'perks',
  'rank_tiers',
  'ranks',
  'provably_fair_seeds',
  'game_history',
  'steam_bot_inventory',
  'steam_trade_offers',
  'vip_subscriptions',
  'user_messages',
  'site_settings',
  'badges',
  'user_badges',
  'server_seeds',
  'client_seeds',
  'game_results',
  'user_perks'
];

async function checkDatabaseTables() {
  console.log('🔍 Checking Supabase Database Tables');
  console.log('=====================================\n');
  
  try {
    // Test connection first
    console.log('🔗 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      return;
    }
    
    console.log('✅ Database connection successful\n');
    
    // Since we can't query information_schema, we'll check each table individually
    console.log('📋 Checking tables by attempting to query each one...');
    
    // Check each expected table
    console.log('🔍 CHECKING EXPECTED TABLES:');
    console.log('============================');
    
    const missingTables = [];
    const existingExpectedTables = [];
    
    for (const tableName of expectedTables) {
      try {
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (countError) {
          // Check if it's a "table doesn't exist" error
          if (countError.message.includes('does not exist') || 
              countError.message.includes('relation') || 
              countError.code === 'PGRST116' || 
              countError.code === '42P01') {
            console.log(`❌ ${tableName} - MISSING`);
            missingTables.push(tableName);
          } else {
            console.log(`✅ ${tableName} - EXISTS (access error: ${countError.message})`);
            existingExpectedTables.push(tableName);
          }
        } else {
          console.log(`✅ ${tableName} - EXISTS (${count || 0} rows)`);
          existingExpectedTables.push(tableName);
        }
      } catch (err) {
        console.log(`❌ ${tableName} - ERROR: ${err.message}`);
        missingTables.push(tableName);
      }
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('===========');
    console.log(`✅ Expected tables found: ${existingExpectedTables.length}/${expectedTables.length}`);
    console.log(`❌ Missing tables: ${missingTables.length}`);
    console.log(`📊 Database check completed for ${expectedTables.length} expected tables`);
    
    if (missingTables.length > 0) {
      console.log('\n🚨 MISSING TABLES THAT NEED TO BE CREATED:');
      console.log('==========================================');
      missingTables.forEach(table => {
        console.log(`❌ ${table}`);
      });
      
      console.log('\n💡 RECOMMENDED ACTIONS:');
      console.log('======================');
      console.log('1. Go to Supabase Dashboard > SQL Editor');
      console.log('2. Look for these SQL files in your project:');
      console.log('   - create-shop-table.sql (for shop_items)');
      console.log('   - SQL_EXECUTION_ORDER.md (for execution order)');
      console.log('   - create-missing-tables.sql (comprehensive setup)');
      console.log('3. Execute the SQL files to create missing tables');
    }
    
    if (existingExpectedTables.length === expectedTables.length) {
      console.log('\n🎉 ALL EXPECTED TABLES ARE PRESENT!');
      console.log('Your database schema is complete.');
    }
    
  } catch (error) {
    console.error('💥 Error checking database:', error.message);
  }
}

checkDatabaseTables();