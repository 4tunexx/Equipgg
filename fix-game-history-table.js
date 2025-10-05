// Check current game_history table structure and fix it
const { createClient } = require('@supabase/supabase-js');

async function checkAndFixGameHistoryTable() {
  console.log('🔧 FIXING GAME_HISTORY TABLE STRUCTURE');
  console.log('='.repeat(50));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Step 1: Check if table exists at all
  console.log('\n1. 🔍 Checking if game_history table exists...');
  try {
    const { data, error } = await supabase
      .from('game_history')
      .select('*')
      .limit(1);
    
    if (error && error.code === 'PGRST106') {
      console.log('❌ Table does not exist');
      console.log('   Creating game_history table...');
      
      // Create the table with correct structure
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS game_history (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          game_type VARCHAR(50) NOT NULL,
          bet_amount DECIMAL(10,2) NOT NULL,
          multiplier DECIMAL(10,4),
          payout DECIMAL(10,2) DEFAULT 0,
          profit_loss DECIMAL(10,2) NOT NULL,
          game_data JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_game_history_user_id ON game_history(user_id);
        CREATE INDEX IF NOT EXISTS idx_game_history_game_type ON game_history(game_type);
        CREATE INDEX IF NOT EXISTS idx_game_history_created_at ON game_history(created_at);
      `;
      
      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      if (createError) {
        console.log('❌ Failed to create table:', createError);
        return;
      } else {
        console.log('✅ Table created successfully');
      }
    } else if (error) {
      console.log('⚠️ Table check error:', error.message);
      
      // The table exists but has wrong structure, let's try to fix it
      console.log('\n2. 🔧 Fixing table structure...');
      
      const alterTableSQL = `
        -- Add missing columns if they don't exist
        DO $$ 
        BEGIN 
          -- Add payout column if missing
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_history' AND column_name = 'payout') THEN
            ALTER TABLE game_history ADD COLUMN payout DECIMAL(10,2) DEFAULT 0;
          END IF;
          
          -- Add multiplier column if missing
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_history' AND column_name = 'multiplier') THEN
            ALTER TABLE game_history ADD COLUMN multiplier DECIMAL(10,4);
          END IF;
          
          -- Add game_data column if missing
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_history' AND column_name = 'game_data') THEN
            ALTER TABLE game_history ADD COLUMN game_data JSONB DEFAULT '{}';
          END IF;
          
          -- Add profit_loss column if missing
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_history' AND column_name = 'profit_loss') THEN
            ALTER TABLE game_history ADD COLUMN profit_loss DECIMAL(10,2) NOT NULL DEFAULT 0;
          END IF;
        END $$;
        
        -- Create indexes if they don't exist
        CREATE INDEX IF NOT EXISTS idx_game_history_user_id ON game_history(user_id);
        CREATE INDEX IF NOT EXISTS idx_game_history_game_type ON game_history(game_type);
        CREATE INDEX IF NOT EXISTS idx_game_history_created_at ON game_history(created_at);
      `;
      
      try {
        const { error: alterError } = await supabase.rpc('exec_sql', { sql: alterTableSQL });
        if (alterError) {
          console.log('❌ Failed to alter table:', alterError);
        } else {
          console.log('✅ Table structure fixed');
        }
      } catch (alterErr) {
        console.log('⚠️ Could not alter table using rpc, trying direct approach...');
        
        // Try adding columns one by one
        const addColumns = [
          'ALTER TABLE game_history ADD COLUMN IF NOT EXISTS payout DECIMAL(10,2) DEFAULT 0',
          'ALTER TABLE game_history ADD COLUMN IF NOT EXISTS multiplier DECIMAL(10,4)',
          'ALTER TABLE game_history ADD COLUMN IF NOT EXISTS game_data JSONB DEFAULT \'{}\'',
          'ALTER TABLE game_history ADD COLUMN IF NOT EXISTS profit_loss DECIMAL(10,2) DEFAULT 0'
        ];
        
        for (const sql of addColumns) {
          try {
            await supabase.rpc('exec_sql', { sql });
            console.log('✅ Executed:', sql.substring(0, 50) + '...');
          } catch (err) {
            console.log('⚠️ Failed:', sql.substring(0, 50) + '...', err.message);
          }
        }
      }
    } else {
      console.log('✅ Table exists and accessible');
      console.log('   Records found:', data?.length || 0);
    }
  } catch (err) {
    console.log('❌ Error checking table:', err.message);
  }

  // Step 3: Test the fixed table
  console.log('\n3. 🧪 Testing fixed table...');
  try {
    const testRecord = {
      user_id: 'test-user-' + Date.now(),
      game_type: 'test',
      bet_amount: 10,
      multiplier: 1.0,
      payout: 10,
      profit_loss: 0,
      game_data: { test: true }
    };

    const { data: insertData, error: insertError } = await supabase
      .from('game_history')
      .insert(testRecord)
      .select()
      .single();

    if (insertError) {
      console.log('❌ Insert still failing:', insertError.message);
      console.log('   Details:', insertError.details);
    } else {
      console.log('✅ Insert successful! Record ID:', insertData.id);
      
      // Clean up
      await supabase.from('game_history').delete().eq('id', insertData.id);
      console.log('✅ Test record cleaned up');
    }
  } catch (err) {
    console.log('❌ Test failed:', err.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎯 Table fix complete! Try the arcade page again.');
}

// Run the fix
checkAndFixGameHistoryTable().catch(console.error);