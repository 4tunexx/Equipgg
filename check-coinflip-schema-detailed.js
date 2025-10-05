const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCoinflipSchema() {
  console.log('Checking coinflip_lobbies table schema...');
  
  try {
    // Try a SELECT * to see what happens
    const { data, error } = await supabase
      .from('coinflip_lobbies')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error selecting from table:', error);
      return;
    }
    
    console.log('Table exists, sample data:', data);
    
    // Now let's try to query with the columns the API expects
    console.log('\nTrying to select expected columns...');
    
    const { data: testData, error: testError } = await supabase
      .from('coinflip_lobbies')
      .select(`
        id,
        creator_id,
        bet_amount,
        creator_side,
        status,
        created_at,
        result,
        winner_id,
        completed_at
      `)
      .limit(1);
    
    if (testError) {
      console.error('Error with expected columns:', testError);
      console.log('This shows which columns are missing or have different names');
    } else {
      console.log('All expected columns exist!');
    }
    
    // Let's also try to insert a test record to see what columns are actually required
    console.log('\nTrying to insert test record to reveal actual schema...');
    
    const testRecord = {
      id: 'schema_test_' + Date.now(),
      creator_id: '8b07e938-1c15-4850-9216-68926bf1b41a',
      bet_amount: 100,
      creator_side: 'heads',
      status: 'waiting',
      created_at: new Date().toISOString()
    };
    
    const { error: insertError } = await supabase
      .from('coinflip_lobbies')
      .insert([testRecord]);
    
    if (insertError) {
      console.error('Insert error reveals schema issues:', insertError);
    } else {
      console.log('Test record inserted successfully!');
      
      // Clean up test record
      await supabase
        .from('coinflip_lobbies')
        .delete()
        .eq('id', testRecord.id);
      
      console.log('Test record cleaned up');
    }
    
  } catch (error) {
    console.error('General error:', error);
  }
}

checkCoinflipSchema();