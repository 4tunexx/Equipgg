// Test the fixed APIs after creating the game_history table
const fetch = require('node-fetch');

async function testFixedGameAPIs() {
  console.log('🧪 TESTING FIXED GAME APIs');
  console.log('='.repeat(50));
  
  console.log('\n⚠️  IMPORTANT: Make sure you have run the SQL script first:');
  console.log('   Go to Supabase Dashboard > SQL Editor');
  console.log('   Copy and paste the SQL from CREATE_GAME_HISTORY_TABLE.sql');
  console.log('   Run the SQL to create the table with correct schema');
  console.log('\n' + '='.repeat(50));

  // Test 1: Game History API (should work without auth, show 401)
  console.log('\n1. 🔍 Testing Game History API...');
  try {
    const historyResponse = await fetch('http://localhost:3001/api/games/history', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`   Status: ${historyResponse.status} ${historyResponse.statusText}`);
    
    if (historyResponse.status === 401) {
      console.log('   ✅ API is working (401 = needs auth, which is expected)');
    } else if (historyResponse.status === 500) {
      const errorText = await historyResponse.text();
      console.log('   ❌ Still getting 500 error:', errorText);
    } else {
      const responseText = await historyResponse.text();
      console.log('   📄 Response:', responseText.substring(0, 200));
    }
  } catch (err) {
    console.log('   ❌ Request failed:', err.message);
  }

  // Test 2: Game Play API
  console.log('\n2. 🎮 Testing Game Play API...');
  try {
    const playResponse = await fetch('http://localhost:3001/api/games/play', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameType: 'crash',
        betAmount: 100,
        gameData: { targetMultiplier: 2.0 }
      })
    });

    console.log(`   Status: ${playResponse.status} ${playResponse.statusText}`);
    
    if (playResponse.status === 401) {
      console.log('   ✅ API is working (401 = needs auth, which is expected)');
    } else if (playResponse.status === 500) {
      const errorText = await playResponse.text();
      console.log('   ❌ Still getting 500 error:', errorText);
    } else {
      const responseText = await playResponse.text();
      console.log('   📄 Response:', responseText.substring(0, 200));
    }
  } catch (err) {
    console.log('   ❌ Request failed:', err.message);
  }

  // Test 3: Check if table exists with direct query
  console.log('\n3. 🗄️ Testing database table...');
  const { createClient } = require('@supabase/supabase-js');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('   ❌ Missing Supabase credentials for direct test');
  } else {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    try {
      const { data, error } = await supabase
        .from('game_history')
        .select('id, game_type, bet_amount, winnings, profit')
        .limit(5);
      
      if (error) {
        console.log('   ❌ Table query failed:', error.message);
        if (error.code === 'PGRST106') {
          console.log('   💡 Table does not exist - run the SQL script first!');
        } else if (error.code === 'PGRST204') {
          console.log('   💡 Table exists but missing columns - run the SQL script!');
        }
      } else {
        console.log('   ✅ Table exists and accessible!');
        console.log(`   📊 Records found: ${data?.length || 0}`);
        if (data && data.length > 0) {
          console.log('   📋 Sample record:', data[0]);
        }
      }
    } catch (err) {
      console.log('   ❌ Direct query failed:', err.message);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎯 TEST SUMMARY:');
  console.log('   If you see 401 errors: ✅ APIs are working, just need authentication');
  console.log('   If you see 500 errors: ❌ Table still not created properly');
  console.log('   If table query works: ✅ Database is ready');
  console.log('\n🚀 NEXT STEPS:');
  console.log('   1. If table missing: Run CREATE_GAME_HISTORY_TABLE.sql in Supabase');
  console.log('   2. If APIs show 401: Test with logged-in user in browser');
  console.log('   3. Check arcade page - should work now!');
}

testFixedGameAPIs().catch(console.error);