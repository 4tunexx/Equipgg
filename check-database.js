#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
  console.log('🔍 Connecting to Supabase database...');
  console.log(`📡 URL: ${supabaseUrl}`);
  
  try {
    // Check basic connection
    const { data: healthCheck, error: healthError } = await supabase
      .from('auth.users')
      .select('count', { count: 'exact', head: true });
    
    if (healthError) {
      console.log('⚠️  Auth table check failed (this is normal for new projects)');
    } else {
      console.log('✅ Database connection successful!');
    }

    // Get all table information from information_schema
    const { data: tables, error: tablesError } = await supabase.rpc('get_table_info');
    
    if (tablesError) {
      console.log('📋 Querying tables directly...');
      
      // Try alternative method to get tables
      const { data: schemaInfo, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_name, table_schema')
        .eq('table_type', 'BASE TABLE')
        .in('table_schema', ['public', 'auth']);

      if (schemaError) {
        console.log('⚠️  Cannot access information_schema, trying individual table checks...');
        await checkIndividualTables();
      } else {
        console.log('\n📊 Database Tables Found:');
        console.log('========================');
        
        const publicTables = schemaInfo.filter(t => t.table_schema === 'public');
        const authTables = schemaInfo.filter(t => t.table_schema === 'auth');
        
        if (publicTables.length > 0) {
          console.log('\n🏢 Public Schema Tables:');
          publicTables.forEach(table => {
            console.log(`  - ${table.table_name}`);
          });
        }
        
        if (authTables.length > 0) {
          console.log('\n🔐 Auth Schema Tables:');
          authTables.forEach(table => {
            console.log(`  - ${table.table_name}`);
          });
        }
        
        if (publicTables.length === 0 && authTables.length === 0) {
          console.log('❌ No tables found in public or auth schemas');
        }
      }
    }

    // Check for specific tables we expect
    console.log('\n🔍 Checking for Expected Tables:');
    console.log('================================');
    
    const expectedTables = [
      'users', 'profiles', 'matches', 'bets', 'items', 'shop_items',
      'user_inventory', 'missions', 'mission_progress', 'achievements',
      'user_achievements', 'game_history', 'provably_fair_seeds',
      'site_settings', 'betting_history'
    ];
    
    for (const tableName of expectedTables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          if (error.code === '42P01') {
            console.log(`❌ ${tableName} - Table does not exist`);
          } else {
            console.log(`⚠️  ${tableName} - ${error.message}`);
          }
        } else {
          console.log(`✅ ${tableName} - Table exists`);
        }
      } catch (err) {
        console.log(`❌ ${tableName} - Error: ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
}

async function checkIndividualTables() {
  console.log('\n🔍 Checking Individual Tables:');
  console.log('==============================');
  
  const commonTables = ['users', 'profiles', 'items', 'matches'];
  
  for (const table of commonTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table} - ${error.message}`);
      } else {
        console.log(`✅ ${table} - Table exists (${data.length} sample rows)`);
      }
    } catch (err) {
      console.log(`❌ ${table} - ${err.message}`);
    }
  }
}

checkDatabase().catch(console.error);