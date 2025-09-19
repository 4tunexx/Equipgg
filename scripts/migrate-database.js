#!/usr/bin/env node

/**
 * Complete Database Migration Script
 * Handles full database cleanup and restoration with all game content
 */

// Skip migration during Vercel builds
if (process.env.VERCEL || process.env.CI) {
  console.log('🚫 Skipping database migration during build process');
  console.log('ℹ️  Database should be migrated separately via Supabase dashboard');
  process.exit(0);
}

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLFile(filename, description) {
  console.log(`� ${description}...`);
  
  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return false;
  }
  
  const sql = fs.readFileSync(filePath, 'utf8');
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error(`❌ Error executing ${filename}:`, error.message);
      return false;
    }
    
    console.log(`✅ ${description} completed successfully`);
    return true;
    
  } catch (err) {
    console.error(`❌ Exception executing ${filename}:`, err.message);
    return false;
  }
}

async function verifyMigration() {
  console.log('\n� Verifying migration...');
  
  const checks = [
    {
      name: 'Users table structure',
      query: `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('display_name', 'xp', 'level')`,
      expected: 3
    },
    {
      name: 'Achievements count',
      query: `SELECT COUNT(*) FROM achievements`,
      expected: 40
    },
    {
      name: 'Missions count', 
      query: `SELECT COUNT(*) FROM missions`,
      expected: 30
    },
    {
      name: 'Items count',
      query: `SELECT COUNT(*) FROM items`,
      expected: 12
    },
    {
      name: 'Perks count',
      query: `SELECT COUNT(*) FROM perks`, 
      expected: 10
    },
    {
      name: 'Rank tiers count',
      query: `SELECT COUNT(*) FROM rank_tiers`,
      expected: 8
    }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql: check.query 
      });
      
      if (error) {
        console.error(`❌ ${check.name}: ${error.message}`);
        allPassed = false;
        continue;
      }
      
      const count = parseInt(data[0]?.count || data[0]?.column_name ? data.length : 0);
      
      if (count >= check.expected) {
        console.log(`✅ ${check.name}: ${count} items`);
      } else {
        console.error(`❌ ${check.name}: Expected ${check.expected}, got ${count}`);
        allPassed = false;
      }
      
    } catch (err) {
      console.error(`❌ ${check.name}: ${err.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function createExecSQLFunction() {
  console.log('🔧 Creating exec_sql helper function...');
  
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
        result json;
    BEGIN
        EXECUTE sql;
        GET DIAGNOSTICS result = ROW_COUNT;
        RETURN json_build_object('rows_affected', result);
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'SQL execution failed: %', SQLERRM;
    END;
    $$;
  `;
  
  try {
    const { error } = await supabase.rpc('exec', { sql: createFunctionSQL });
    if (!error) {
      console.log('✅ Helper function created');
      return true;
    }
  } catch (err) {
    // Function might not be needed for direct SQL execution
    console.log('ℹ️  Using direct SQL execution method');
    return true;
  }
  
  return true;
}

async function main() {
  console.log('🚀 Starting Complete Database Migration');
  console.log('=====================================\n');
  
  try {
    // Step 1: Create helper function
    await createExecSQLFunction();
    
    // Step 2: Database cleanup
    const cleanupSuccess = await executeSQLFile(
      '00_cleanup_database.sql', 
      'Cleaning up existing database'
    );
    
    if (!cleanupSuccess) {
      console.error('❌ Database cleanup failed. Aborting migration.');
      process.exit(1);
    }
    
    // Step 3: Apply production schema
    const schemaSuccess = await executeSQLFile(
      'production_schema.sql',
      'Applying production database schema'
    );
    
    if (!schemaSuccess) {
      console.error('❌ Schema application failed. Aborting migration.');
      process.exit(1);
    }
    
    // Step 4: Seed game content
    const seedSuccess = await executeSQLFile(
      'seed_game_content.sql',
      'Seeding game content (achievements, missions, items, etc.)'
    );
    
    if (!seedSuccess) {
      console.error('❌ Game content seeding failed. Database may be partially migrated.');
      process.exit(1);
    }
    
    // Step 5: Verify migration
    const verificationSuccess = await verifyMigration();
    
    if (verificationSuccess) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('\n📋 What was restored:');
      console.log('  • 40+ Achievements (Betting, Economic, Progression, Social)');
      console.log('  • 30+ Missions (Daily + Main storyline)');
      console.log('  • 12+ Items (Knives, Gloves, Rifles, Pistols)');
      console.log('  • 10 Perks/Power-ups (XP boosts, Coin boosts, VIP status)');
      console.log('  • 8 Rank tiers (Newcomer to Immortal)');
      console.log('  • Leaderboard system with caching');
      console.log('  • Game configuration settings');
      console.log('\n🚀 Your database is now ready for production!');
    } else {
      console.log('\n⚠️  Migration completed with warnings. Please check the verification results above.');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⚠️  Migration interrupted. Database may be in an inconsistent state.');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run migration
main();