const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addVipTierColumn() {
  try {
    console.log('🔧 Adding vip_tier column to users table...');
    
    // First, let's check current users table structure
    const { data: users, error: getUsersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (getUsersError) {
      console.error('❌ Error checking users table:', getUsersError.message);
      return;
    }
    
    console.log('📋 Current users table columns:', Object.keys(users[0] || {}));
    
    // Try to add the column using a raw SQL approach
    // Since we can't use exec_sql, we'll need to use the REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_tier TEXT DEFAULT NULL;'
      })
    });
    
    if (response.ok) {
      console.log('✅ vip_tier column added successfully');
    } else {
      const error = await response.text();
      console.error('❌ Failed to add column:', error);
      
      // Alternative approach: try to update users table schema manually
      console.log('🔄 Trying alternative approach...');
      
      // Let's try to add some sample data to see if we can infer the column
      const { error: updateError } = await supabase
        .from('users')
        .update({ vip_tier: 'bronze' })
        .eq('id', 'non-existent-id'); // This will fail but might create the column
      
      if (updateError && updateError.message.includes('column "vip_tier" does not exist')) {
        console.log('❌ Column still doesn\'t exist. Manual database intervention required.');
        console.log('\n📝 Please run this SQL command in your Supabase SQL Editor:');
        console.log('ALTER TABLE users ADD COLUMN vip_tier TEXT DEFAULT NULL;');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addVipTierColumn().then(() => {
  console.log('\n🎯 Migration completed');
  process.exit(0);
});