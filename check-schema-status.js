// Check if MANUAL_SCHEMA_FIXES.sql has been applied
const { createClient } = require('@supabase/supabase-js');

async function checkSchemaFixesStatus() {
  console.log('🔍 CHECKING MANUAL_SCHEMA_FIXES.sql STATUS');
  console.log('='.repeat(50));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Check 1: Users table columns
  console.log('\n1. 📋 Checking users table columns...');
  const userColumns = ['vip_tier', 'vip_expires_at', 'balance', 'last_login', 'is_active'];
  
  for (const column of userColumns) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(column)
        .limit(1);
      
      if (error && error.code === 'PGRST204') {
        console.log(`   ❌ Column '${column}' missing from users table`);
      } else if (error) {
        console.log(`   ⚠️ Error checking '${column}':`, error.message);
      } else {
        console.log(`   ✅ Column '${column}' exists`);
      }
    } catch (err) {
      console.log(`   ❌ Failed to check '${column}':`, err.message);
    }
  }

  // Check 2: New tables
  console.log('\n2. 🗄️ Checking new tables...');
  const tables = ['trade_history', 'trade_offer_items', 'trade_offer_requests', 'match_predictions'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error && error.code === 'PGRST106') {
        console.log(`   ❌ Table '${table}' does not exist`);
      } else if (error) {
        console.log(`   ⚠️ Error checking '${table}':`, error.message);
      } else {
        console.log(`   ✅ Table '${table}' exists`);
      }
    } catch (err) {
      console.log(`   ❌ Failed to check '${table}':`, err.message);
    }
  }

  // Check 3: Critical for arcade - game_history table
  console.log('\n3. 🎮 Checking game_history table (critical for arcade)...');
  try {
    const { data, error } = await supabase
      .from('game_history')
      .select('id, winnings, profit, game_data, result')
      .limit(1);
    
    if (error && error.code === 'PGRST106') {
      console.log('   ❌ game_history table does not exist');
      console.log('   💡 NEED TO RUN: CREATE_GAME_HISTORY_TABLE.sql');
    } else if (error && error.code === 'PGRST204') {
      console.log('   ❌ game_history table missing required columns');
      console.log('   💡 NEED TO RUN: CREATE_GAME_HISTORY_TABLE.sql');
    } else if (error) {
      console.log('   ⚠️ game_history table error:', error.message);
    } else {
      console.log('   ✅ game_history table exists with correct columns');
    }
  } catch (err) {
    console.log('   ❌ Failed to check game_history:', err.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎯 SCHEMA STATUS SUMMARY:');
  console.log('\n📋 MANUAL_SCHEMA_FIXES.sql contains:');
  console.log('   - Users table column additions (vip_tier, balance, etc.)');
  console.log('   - New tables: trade_history, trade_offer_items, etc.');
  console.log('   - RLS policies and indexes');
  console.log('\n🎮 CREATE_GAME_HISTORY_TABLE.sql contains:');
  console.log('   - game_history table for arcade functionality');
  console.log('   - CRITICAL for fixing crash game errors');
  
  console.log('\n🚀 ACTION NEEDED:');
  console.log('   If any ❌ errors above: Run the corresponding SQL in Supabase Dashboard');
  console.log('   1. MANUAL_SCHEMA_FIXES.sql for admin panel features');
  console.log('   2. CREATE_GAME_HISTORY_TABLE.sql for arcade games (PRIORITY)');
}

checkSchemaFixesStatus().catch(console.error);