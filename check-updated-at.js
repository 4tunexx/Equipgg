const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUpdatedAtColumn() {
  console.log('Checking if coinflip_lobbies has updated_at column...');
  
  try {
    const { data, error } = await supabase
      .from('coinflip_lobbies')
      .select('updated_at')
      .limit(1);
    
    if (error) {
      console.error('updated_at column does NOT exist:', error.message);
    } else {
      console.log('✓ updated_at column exists');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUpdatedAtColumn();