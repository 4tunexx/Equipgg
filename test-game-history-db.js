// Test the game history API and database connection
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

async function testGameHistoryAPI() {
  console.log('🔍 TESTING GAME HISTORY API AND DATABASE');
  console.log('='.repeat(50));

  // Test 1: Check if we can connect to Supabase directly
  console.log('\n1. 📡 Testing Direct Supabase Connection...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase credentials');
    console.log(`   URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Key: ${supabaseKey ? '✅ Set' : '❌ Missing'}`);
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test 2: Check if game_history table exists
  console.log('\n2. 🗄️ Checking game_history table...');
  try {
    const { data, error } = await supabase
      .from('game_history')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.log('❌ game_history table error:', error.message);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
    } else {
      console.log('✅ game_history table exists and accessible');
      console.log(`   Query result:`, data);
    }
  } catch (err) {
    console.log('❌ Error querying game_history table:', err.message);
  }

  // Test 3: Check table structure
  console.log('\n3. 🔍 Checking table structure...');
  try {
    const { data: schema, error: schemaError } = await supabase.rpc('get_table_schema', { 
      table_name: 'game_history' 
    });
    
    if (schemaError) {
      console.log('⚠️ Could not get schema info:', schemaError.message);
    } else {
      console.log('✅ Table schema accessible');
    }
  } catch (err) {
    console.log('⚠️ Schema check failed (this is normal):', err.message);
  }

  // Test 4: Test creating a simple record
  console.log('\n4. ✏️ Testing record creation...');
  try {
    const testRecord = {
      user_id: 'test-user-' + Date.now(),
      game_type: 'test',
      bet_amount: 10,
      multiplier: 1.0,
      payout: 10,
      profit_loss: 0,
      game_data: { test: true },
      created_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabase
      .from('game_history')
      .insert(testRecord)
      .select()
      .single();

    if (insertError) {
      console.log('❌ Insert failed:', insertError.message);
      console.log('   Details:', insertError.details);
      console.log('   Code:', insertError.code);
    } else {
      console.log('✅ Record created successfully:', insertData.id);
      
      // Clean up test record
      await supabase.from('game_history').delete().eq('id', insertData.id);
      console.log('✅ Test record cleaned up');
    }
  } catch (err) {
    console.log('❌ Insert test failed:', err.message);
  }

  // Test 5: Test the API endpoint directly
  console.log('\n5. 🌐 Testing API endpoint...');
  try {
    const response = await fetch('http://localhost:3001/api/games/history', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: This won't work without auth, but will show the error
      },
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log(`   Response:`, responseText.substring(0, 200));
    
    if (response.status === 401) {
      console.log('✅ API is running (401 = needs auth, which is expected)');
    } else if (response.status === 500) {
      console.log('❌ API has internal server error');
    }
  } catch (err) {
    console.log('❌ API request failed:', err.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎯 DIAGNOSIS SUMMARY:');
  console.log('   If game_history table doesn\'t exist or has wrong structure,');
  console.log('   that\'s the root cause of the 500 errors.');
  console.log('   Fix: Create the table with correct schema.');
}

// Run the test
testGameHistoryAPI().catch(console.error);