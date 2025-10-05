// Quick script to check if coinflip tables exist
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCoinflipTables() {
  try {
    console.log('🔍 Checking coinflip_lobbies table...');
    
    const { data, error } = await supabase
      .from('coinflip_lobbies')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') {
        console.log('❌ coinflip_lobbies table does not exist');
        return false;
      } else {
        console.error('❌ Unexpected error:', error);
        return false;
      }
    }
    
    console.log('✅ coinflip_lobbies table exists');
    console.log('📊 Sample data count:', data?.length || 0);
    
    // Also check the schema
    const { data: schemaData, error: schemaError } = await supabase
      .from('coinflip_lobbies')
      .select('*')
      .limit(0);
    
    if (!schemaError) {
      console.log('📋 Table structure confirmed');
    }
    
    return true;
    
  } catch (error) {
    console.error('💥 Failed to check tables:', error);
    return false;
  }
}

checkCoinflipTables().then(() => process.exit(0));