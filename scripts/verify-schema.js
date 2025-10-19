// Script to verify Supabase schema and list all tables
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySchema() {
  console.log('🔍 Verifying Supabase Schema...\n');

  try {
    // Query information_schema to get all tables
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (error) {
      console.error('❌ Error fetching tables:', error);
      
      // Fallback: Try to query known tables directly
      console.log('\n📋 Attempting to verify known tables...\n');
      const knownTables = [
        'users', 'matches', 'bets', 'crates', 'missions', 
        'achievements', 'inventory', 'leaderboard', 'xp_log',
        'user_missions', 'user_achievements', 'chat_messages',
        'chat_channels', 'items', 'transactions'
      ];

      for (const tableName of knownTables) {
        try {
          const { count, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

          if (countError) {
            console.log(`❌ ${tableName} - NOT FOUND or ERROR: ${countError.message}`);
          } else {
            console.log(`✅ ${tableName} - EXISTS (${count || 0} rows)`);
          }
        } catch (err) {
          console.log(`❌ ${tableName} - ERROR: ${err.message}`);
        }
      }
      return;
    }

    if (!tables || tables.length === 0) {
      console.log('⚠️  No tables found in public schema');
      return;
    }

    console.log(`✅ Found ${tables.length} tables:\n`);
    
    // Check each table for row count
    for (const table of tables) {
      const tableName = table.table_name;
      
      try {
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (countError) {
          console.log(`  📋 ${tableName} - ERROR: ${countError.message}`);
        } else {
          console.log(`  ✅ ${tableName} (${count || 0} rows)`);
        }
      } catch (err) {
        console.log(`  ⚠️  ${tableName} - Could not count rows`);
      }
    }

    // Check for required tables
    console.log('\n🔍 Checking required tables...\n');
    const requiredTables = [
      'users', 'matches', 'bets', 'crates', 'missions', 
      'achievements', 'inventory', 'leaderboard', 'xp_log'
    ];

    const existingTableNames = tables.map(t => t.table_name);
    const missingTables = requiredTables.filter(t => !existingTableNames.includes(t));

    if (missingTables.length > 0) {
      console.log('❌ Missing required tables:');
      missingTables.forEach(t => console.log(`   - ${t}`));
    } else {
      console.log('✅ All required tables exist!');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

verifySchema();
