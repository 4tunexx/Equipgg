const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTableExists(tableName) {
  try {
    console.log(`\n🔍 Testing table: ${tableName}`);
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`❌ Table '${tableName}' does not exist`);
        return false;
      } else {
        console.log(`⚠️  Table '${tableName}' exists but error:`, error.message);
        return true;
      }
    } else {
      console.log(`✅ Table '${tableName}' exists! Found ${data ? data.length : 0} records`);
      return true;
    }
  } catch (err) {
    console.log(`❌ Error testing table '${tableName}':`, err.message);
    return false;
  }
}

async function main() {
  console.log('🧪 Testing missing tables...\n');

  const tablesToTest = [
    'matches',
    'flash_sales',
    'polls',
    'poll_options',
    'poll_votes',
    'match_votes'
  ];

  const results = {};

  for (const table of tablesToTest) {
    results[table] = await testTableExists(table);
  }

  console.log('\n📊 SUMMARY:');
  console.log('===========');

  const existing = Object.entries(results).filter(([_, exists]) => exists);
  const missing = Object.entries(results).filter(([_, exists]) => !exists);

  console.log(`✅ Existing tables: ${existing.length}`);
  existing.forEach(([table]) => console.log(`   - ${table}`));

  console.log(`❌ Missing tables: ${missing.length}`);
  missing.forEach(([table]) => console.log(`   - ${table}`));

  if (missing.length === 0) {
    console.log('\n🎉 All tables exist! Your database is complete.');
  } else {
    console.log(`\n⚠️  ${missing.length} tables still missing.`);
  }
}

main().catch(console.error);