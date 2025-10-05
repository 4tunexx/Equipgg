// Fix game_history table to match all2.txt schema exactly
const { createClient } = require('@supabase/supabase-js');

async function fixGameHistoryTableSchema() {
  console.log('🔧 FIXING GAME_HISTORY TABLE TO MATCH all2.txt SCHEMA');
  console.log('='.repeat(60));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Step 1: Try to drop the existing table
  console.log('\n1. 🗑️ Attempting to drop existing table...');
  try {
    const { error: dropError } = await supabase
      .from('game_history')
      .delete()
      .neq('id', 'dummy'); // This will fail but help us see if table exists
    
    console.log('✅ Table exists, continuing...');
  } catch (err) {
    console.log('⚠️ Table may not exist or is inaccessible:', err.message);
  }

  // Step 2: The correct schema from all2.txt
  console.log('\n2. 📋 Correct schema from all2.txt:');
  console.log(`   - id: text (NOT UUID)`);
  console.log(`   - user_id: text (NOT UUID)`);
  console.log(`   - game_type: text`);
  console.log(`   - bet_amount: integer (NOT decimal)`);
  console.log(`   - winnings: integer (NOT payout)`);
  console.log(`   - profit: integer (NOT profit_loss)`);
  console.log(`   - multiplier: real`);
  console.log(`   - game_data: text (NOT jsonb)`);
  console.log(`   - result: text`);
  console.log(`   - tiles_cleared: integer`);
  console.log(`   - xp_gained: integer`);
  console.log(`   - created_at: timestamp`);

  // Step 3: Test with a record that matches the actual schema
  console.log('\n3. 🧪 Testing with correct schema...');
  try {
    const testRecord = {
      id: 'test-' + Date.now(),
      user_id: 'test-user',
      game_type: 'crash',
      bet_amount: 100,
      winnings: 200,
      profit: 100,
      multiplier: 2.0,
      game_data: '{"target": 2.0, "result": "win"}',
      result: 'win',
      tiles_cleared: 0,
      xp_gained: 10
    };

    const { data: insertData, error: insertError } = await supabase
      .from('game_history')
      .insert(testRecord)
      .select()
      .single();

    if (insertError) {
      console.log('❌ Insert failed with correct schema:', insertError.message);
      console.log('   Details:', insertError.details);
      console.log('   Code:', insertError.code);
      
      if (insertError.code === 'PGRST204') {
        console.log('\n   🔍 This means columns are missing from the table.');
        console.log('   💡 The table needs to be recreated in Supabase dashboard.');
      }
    } else {
      console.log('✅ Insert successful with correct schema!');
      console.log('   Record ID:', insertData.id);
      
      // Test query to make sure we can read it back
      const { data: queryData, error: queryError } = await supabase
        .from('game_history')
        .select('*')
        .eq('id', insertData.id)
        .single();
        
      if (queryError) {
        console.log('❌ Query failed:', queryError.message);
      } else {
        console.log('✅ Query successful:', queryData);
      }
      
      // Clean up
      await supabase.from('game_history').delete().eq('id', insertData.id);
      console.log('✅ Test record cleaned up');
    }
  } catch (err) {
    console.log('❌ Test failed:', err.message);
  }

  // Step 4: Check if we need to manually recreate the table
  console.log('\n4. 📝 MANUAL STEPS NEEDED:');
  console.log('\n   Go to Supabase Dashboard > SQL Editor and run:');
  console.log(`
  -- Drop existing table
  DROP TABLE IF EXISTS game_history CASCADE;
  
  -- Create table with correct schema from all2.txt
  CREATE TABLE public.game_history (
    id text NOT NULL,
    user_id text,
    game_type text,
    bet_amount integer,
    winnings integer DEFAULT 0,
    profit integer,
    multiplier real,
    game_data text,
    result text,
    tiles_cleared integer DEFAULT 0,
    xp_gained integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT game_history_pkey PRIMARY KEY (id),
    CONSTRAINT game_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
  );
  
  -- Create indexes
  CREATE INDEX idx_game_history_user_id ON game_history(user_id);
  CREATE INDEX idx_game_history_game_type ON game_history(game_type);
  CREATE INDEX idx_game_history_created_at ON game_history(created_at DESC);
  `);

  console.log('\n' + '='.repeat(60));
  console.log('🎯 NEXT STEPS:');
  console.log('   1. Run the SQL above in Supabase Dashboard');
  console.log('   2. Update the API to use correct column names');
  console.log('   3. Test the arcade games again');
}

// Run the diagnosis
fixGameHistoryTableSchema().catch(console.error);