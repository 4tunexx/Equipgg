const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkActualColumns() {
  console.log('Discovering actual columns in coinflip_lobbies...');
  
  const commonColumns = [
    'id',
    'creator_id', 
    'user_id',
    'bet_amount',
    'amount',
    'creator_side',
    'side',
    'heads_tails',
    'choice',
    'status',
    'state',
    'created_at',
    'result',
    'outcome',
    'winner_id',
    'winner',
    'completed_at',
    'finished_at',
    'joiner_id',
    'joiner_side',
    'opponent_id'
  ];
  
  const existingColumns = [];
  
  for (const col of commonColumns) {
    try {
      const { data, error } = await supabase
        .from('coinflip_lobbies')
        .select(col)
        .limit(1);
      
      if (!error) {
        existingColumns.push(col);
        console.log(`✓ Column exists: ${col}`);
      }
    } catch (e) {
      // Column doesn't exist
    }
  }
  
  console.log('\nExisting columns found:', existingColumns);
  
  // Now let's try to do a more comprehensive select with just the existing columns
  if (existingColumns.length > 0) {
    console.log('\nTrying full select with existing columns...');
    const { data, error } = await supabase
      .from('coinflip_lobbies')
      .select(existingColumns.join(', '))
      .limit(5);
      
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Sample data:', data);
    }
  }
}

checkActualColumns();