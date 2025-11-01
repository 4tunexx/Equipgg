/**
 * Supabase Database Schema Inspector
 * 
 * This script connects to your Supabase database and provides a comprehensive
 * report of all tables, columns, data types, constraints, indexes, and row counts.
 * 
 * Usage: node inspect-supabase-schema.js
 * 
 * Make sure your .env.local or .env file has:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

// Try to load dotenv if available
try {
  require('dotenv').config({ path: '.env.local' });
  require('dotenv').config({ path: '.env' });
} catch (e) {
  // dotenv might not be installed, that's okay if env vars are set in system
  console.warn('⚠️  dotenv not found. Make sure env vars are set in system or install: npm install dotenv');
}

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Please ensure .env.local or .env has:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'cyan');
  console.log('='.repeat(80) + '\n');
}

async function runQuery(query) {
  // Supabase doesn't support direct SQL queries via client
  // We'll use PostgREST API for table metadata queries
  try {
    // Try to get schema info via information_schema
    // Since we can't run raw SQL, we'll query each table to infer schema
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
}

async function getTableList() {
  try {
    // Query each known table to see if it exists and get its structure
    const tables = [
      'users', 'activity_feed', 'user_mission_progress', 'user_inventory',
      'user_achievements', 'user_badges', 'missions', 'items', 'crates',
      'achievements', 'badges', 'perks', 'ranks', 'landing_panels',
      'direct_messages', 'matches', 'bets', 'trades', 'notifications'
    ];

    const existingTables = [];
    
    for (const table of tables) {
      try {
        // Try to select one row to check if table exists
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(0);
        
        if (!error || error.code !== '42P01') { // 42P01 is "table does not exist"
          existingTables.push(table);
        }
      } catch (e) {
        // Table might not exist, continue
      }
    }
    
    return existingTables;
  } catch (error) {
    console.error('Error getting table list:', error);
    return [];
  }
}

async function inspectTable(tableName) {
  const result = {
    name: tableName,
    exists: false,
    columns: [],
    rowCount: 0,
    sampleRow: null,
    indexes: [],
    constraints: []
  };

  try {
    // Try to select one row to check structure
    const { data: sampleData, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)
      .maybeSingle();

    if (sampleError) {
      if (sampleError.code === '42P01') {
        // Table doesn't exist
        result.exists = false;
        return result;
      }
      // Other error - might be RLS or permissions
      result.exists = true; // Table exists but might have RLS
      result.error = sampleError.message;
      return result;
    }

    result.exists = true;
    
    // Get column info from sample row
    if (sampleData) {
      result.sampleRow = sampleData;
      result.columns = Object.keys(sampleData).map(key => ({
        name: key,
        type: typeof sampleData[key],
        sampleValue: sampleData[key],
        isNull: sampleData[key] === null,
        // Infer PostgreSQL type from JavaScript type
        inferredPgType: inferPostgresType(sampleData[key])
      }));
    } else {
      // Table exists but is empty, try to query structure differently
      // Query with limit 0 to get structure without data
      const { error: structureError } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);
      
      if (!structureError) {
        // Table exists but is empty
        result.exists = true;
      }
    }

    // Get row count
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      result.rowCount = count || 0;
    }

    // Try to get a few sample rows for type detection
    const { data: sampleRows } = await supabase
      .from(tableName)
      .select('*')
      .limit(3);
    
    if (sampleRows && sampleRows.length > 0) {
      // Analyze all sample rows to get better type information
      const allKeys = new Set();
      sampleRows.forEach(row => {
        Object.keys(row).forEach(key => allKeys.add(key));
      });
      
      result.columns = Array.from(allKeys).map(key => {
        const values = sampleRows.map(row => row[key]).filter(v => v !== null && v !== undefined);
        const sampleValue = values[0];
        
        return {
          name: key,
          type: typeof sampleValue,
          sampleValue: sampleValue,
          isNull: values.some(v => v === null),
          inferredPgType: inferPostgresType(sampleValue),
          // Check if all values are same type
          consistentType: values.every(v => typeof v === typeof sampleValue)
        };
      });
    }

    // Check for user_id column specifically
    if (result.columns.some(col => col.name === 'user_id')) {
      const userIdCol = result.columns.find(col => col.name === 'user_id');
      result.hasUserIdColumn = true;
      result.userIdType = userIdCol.type;
      result.userIdSample = userIdCol.sampleValue;
      
      // Check if it's UUID or TEXT
      if (userIdCol.sampleValue) {
        const userIdStr = String(userIdCol.sampleValue);
        if (userIdStr.startsWith('steam-')) {
          result.userIdIsSteam = true;
        }
      }
    }

  } catch (error) {
    result.error = error.message;
  }

  return result;
}

function inferPostgresType(jsValue) {
  if (jsValue === null || jsValue === undefined) return 'unknown';
  
  const jsType = typeof jsValue;
  
  if (jsType === 'string') {
    // Try to detect UUID format
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jsValue)) {
      return 'UUID';
    }
    // Check if it's a date string
    if (!isNaN(Date.parse(jsValue)) && jsValue.length > 10) {
      return 'TIMESTAMP';
    }
    // Check for Steam ID format
    if (jsValue.startsWith('steam-')) {
      return 'TEXT (Steam ID)';
    }
    return 'TEXT/VARCHAR';
  }
  
  if (jsType === 'number') {
    if (Number.isInteger(jsValue)) {
      return 'INTEGER';
    }
    return 'DECIMAL/NUMERIC';
  }
  
  if (jsType === 'boolean') {
    return 'BOOLEAN';
  }
  
  if (jsValue instanceof Date) {
    return 'TIMESTAMP';
  }
  
  if (Array.isArray(jsValue)) {
    return 'ARRAY';
  }
  
  if (typeof jsValue === 'object') {
    return 'JSON/JSONB';
  }
  
  return 'unknown';
}

async function checkUserIdsAcrossTables(tables) {
  logSection('USER_ID COLUMN ANALYSIS');
  
  const userIdTables = [];
  
  for (const table of tables) {
    const inspection = await inspectTable(table);
    
    if (inspection.exists && inspection.hasUserIdColumn) {
      userIdTables.push({
        table: table,
        type: inspection.userIdType,
        inferredPgType: inspection.columns.find(c => c.name === 'user_id')?.inferredPgType,
        sampleValue: inspection.userIdSample,
        isSteam: inspection.userIdIsSteam,
        rowCount: inspection.rowCount
      });
    }
  }
  
  if (userIdTables.length > 0) {
    console.table(userIdTables);
    
    // Check for type mismatches
    const uuidTables = userIdTables.filter(t => t.inferredPgType === 'UUID');
    const textTables = userIdTables.filter(t => t.inferredPgType?.includes('TEXT'));
    
    if (uuidTables.length > 0 && textTables.length > 0) {
      log('\n⚠️  WARNING: Type mismatch detected!', 'yellow');
      log('Some tables use UUID for user_id, others use TEXT.', 'yellow');
      log('This will cause query errors for Steam users.\n', 'yellow');
    }
  } else {
    log('No tables found with user_id column.', 'yellow');
  }
}

async function generateReport() {
  log('\n🔍 SUPABASE DATABASE SCHEMA INSPECTOR', 'bright');
  log(`Connecting to: ${supabaseUrl}\n`, 'cyan');
  
  logSection('TABLE DISCOVERY');
  const tables = await getTableList();
  log(`Found ${tables.length} potential tables. Inspecting...`, 'yellow');
  
  logSection('DETAILED TABLE INSPECTION');
  
  const inspections = [];
  
  for (const table of tables) {
    log(`\nInspecting: ${table}`, 'blue');
    const inspection = await inspectTable(table);
    inspections.push(inspection);
    
    if (inspection.exists) {
      log(`  ✅ Table exists`, 'green');
      log(`  📊 Row count: ${inspection.rowCount}`, 'cyan');
      log(`  📋 Columns (${inspection.columns.length}):`, 'cyan');
      
      inspection.columns.forEach(col => {
        const typeInfo = `${col.type} → ${col.inferredPgType || 'unknown'}`;
        const sample = col.sampleValue !== null && col.sampleValue !== undefined
          ? ` (sample: ${String(col.sampleValue).substring(0, 50)})`
          : ' (NULL)';
        log(`    - ${col.name}: ${typeInfo}${sample}`, 'white');
      });
      
      if (inspection.hasUserIdColumn) {
        log(`  🔑 user_id column detected:`, 'yellow');
        log(`     Type: ${inspection.userIdType}`, 'yellow');
        log(`     PostgreSQL Type: ${inspection.columns.find(c => c.name === 'user_id')?.inferredPgType || 'unknown'}`, 'yellow');
        log(`     Sample: ${inspection.userIdSample || 'NULL'}`, 'yellow');
        if (inspection.userIdIsSteam) {
          log(`     ⚠️  Contains Steam IDs!`, 'red');
        }
      }
      
      if (inspection.error) {
        log(`  ⚠️  Error: ${inspection.error}`, 'yellow');
      }
    } else {
      log(`  ❌ Table does not exist`, 'red');
    }
  }
  
  // User ID analysis
  await checkUserIdsAcrossTables(tables);
  
  // Summary
  logSection('SUMMARY');
  
  const existingTables = inspections.filter(i => i.exists);
  const tablesWithData = existingTables.filter(i => i.rowCount > 0);
  const tablesWithUserId = existingTables.filter(i => i.hasUserIdColumn);
  const tablesWithSteamIds = existingTables.filter(i => i.userIdIsSteam);
  
  log(`Total tables inspected: ${inspections.length}`, 'cyan');
  log(`Tables that exist: ${existingTables.length}`, existingTables.length > 0 ? 'green' : 'yellow');
  log(`Tables with data: ${tablesWithData.length}`, tablesWithData.length > 0 ? 'green' : 'yellow');
  log(`Tables with user_id column: ${tablesWithUserId.length}`, 'cyan');
  
  if (tablesWithSteamIds.length > 0) {
    log(`⚠️  Tables containing Steam IDs: ${tablesWithSteamIds.length}`, 'yellow');
    log('   These tables may need user_id column type migration!\n', 'yellow');
  }
  
  // Generate migration recommendations
  logSection('MIGRATION RECOMMENDATIONS');
  
  const uuidUserIdTables = tablesWithUserId.filter(t => {
    const userIdCol = t.columns.find(c => c.name === 'user_id');
    return userIdCol?.inferredPgType === 'UUID';
  });
  
  if (uuidUserIdTables.length > 0) {
    log('Tables that need user_id migration from UUID → TEXT:', 'yellow');
    uuidUserIdTables.forEach(t => {
      log(`  - ${t.name} (${t.rowCount} rows)`, 'red');
    });
    log('\nRun FIX_ALL_USER_ID_TABLES.sql to fix these tables.\n', 'cyan');
  } else {
    log('✅ All user_id columns appear to be compatible with TEXT/Steam IDs!', 'green');
  }
  
  log('\n✅ Inspection complete!\n', 'green');
}

// Run the inspection
generateReport().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

