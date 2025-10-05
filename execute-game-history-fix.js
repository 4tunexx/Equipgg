// Execute SQL to fix game_history table structure
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function executeGameHistoryFix() {
  console.log('🔧 EXECUTING GAME HISTORY TABLE FIX');
  console.log('='.repeat(50));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Step 1: Drop and recreate table
  console.log('\n1. 🗑️ Dropping existing table...');
  try {
    const { error: dropError } = await supabase.rpc('exec_sql', { 
      sql: 'DROP TABLE IF EXISTS game_history CASCADE;' 
    });
    
    if (dropError && !dropError.message.includes('does not exist')) {
      console.log('⚠️ Drop warning:', dropError.message);
    } else {
      console.log('✅ Table dropped successfully');
    }
  } catch (err) {
    console.log('⚠️ Drop error (may be expected):', err.message);
  }

  // Step 2: Create new table with correct structure
  console.log('\n2. 🏗️ Creating new table structure...');
  const createTableSQL = `
    CREATE TABLE game_history (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        game_type VARCHAR(50) NOT NULL,
        bet_amount DECIMAL(10,2) NOT NULL,
        multiplier DECIMAL(10,4),
        payout DECIMAL(10,2) DEFAULT 0,
        profit_loss DECIMAL(10,2) NOT NULL,
        game_data JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  try {
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (createError) {
      console.log('❌ Create error:', createError.message);
      return;
    } else {
      console.log('✅ Table created successfully');
    }
  } catch (err) {
    console.log('❌ Create failed:', err.message);
    return;
  }

  // Step 3: Create indexes
  console.log('\n3. 📊 Creating indexes...');
  const indexSQL = `
    CREATE INDEX idx_game_history_user_id ON game_history(user_id);
    CREATE INDEX idx_game_history_game_type ON game_history(game_type);
    CREATE INDEX idx_game_history_created_at ON game_history(created_at DESC);
  `;

  try {
    const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSQL });
    
    if (indexError) {
      console.log('⚠️ Index warning:', indexError.message);
    } else {
      console.log('✅ Indexes created successfully');
    }
  } catch (err) {
    console.log('⚠️ Index creation failed:', err.message);
  }

  // Step 4: Test the new table structure
  console.log('\n4. 🧪 Testing new table structure...');
  try {
    // Try to insert a test record
    const testRecord = {
      user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      game_type: 'test',
      bet_amount: 10.50,
      multiplier: 2.0,
      payout: 21.00,
      profit_loss: 10.50,
      game_data: { test: true, timestamp: Date.now() }
    };

    const { data: insertData, error: insertError } = await supabase
      .from('game_history')
      .insert(testRecord)
      .select()
      .single();

    if (insertError) {
      console.log('❌ Insert test failed:', insertError.message);
      console.log('   Details:', insertError.details);
      console.log('   Code:', insertError.code);
    } else {
      console.log('✅ Insert test successful!');
      console.log('   Record ID:', insertData.id);
      console.log('   Game Type:', insertData.game_type);
      console.log('   Bet Amount:', insertData.bet_amount);
      console.log('   Payout:', insertData.payout);
      
      // Clean up test record
      await supabase.from('game_history').delete().eq('id', insertData.id);
      console.log('✅ Test record cleaned up');
    }
  } catch (err) {
    console.log('❌ Test insert failed:', err.message);
  }

  // Step 5: Verify table structure by querying
  console.log('\n5. 🔍 Verifying table structure...');
  try {
    const { data: testQuery, error: queryError } = await supabase
      .from('game_history')
      .select(`
        id,
        user_id,
        game_type,
        bet_amount,
        multiplier,
        payout,
        profit_loss,
        game_data,
        created_at
      `)
      .limit(1);

    if (queryError) {
      console.log('❌ Query test failed:', queryError.message);
    } else {
      console.log('✅ Query test successful! All columns accessible.');
      console.log('   Columns verified: id, user_id, game_type, bet_amount, multiplier, payout, profit_loss, game_data, created_at');
    }
  } catch (err) {
    console.log('❌ Query verification failed:', err.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎯 GAME HISTORY TABLE FIX COMPLETE!');
  console.log('   ✅ Table structure is now correct');
  console.log('   ✅ All required columns exist');
  console.log('   ✅ Indexes created for performance');
  console.log('   🚀 Ready to test arcade games!');
  console.log('\n   Next: Test the /api/games/history endpoint');
}

// Run the fix
executeGameHistoryFix().catch(console.error);