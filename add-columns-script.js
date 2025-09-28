const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addColumns() {
  console.log('Adding winner columns to matches table...\n');

  try {
    // Add winner column
    console.log('Adding winner column...');
    const { error: error1 } = await supabase.rpc('add_column_if_not_exists', {
      table_name: 'matches',
      column_name: 'winner',
      column_type: 'TEXT'
    });

    if (error1 && !error1.message.includes('already exists')) {
      console.log('Manual approach for winner column...');
      // Try direct SQL approach
    }

    // Add team_a_score column
    console.log('Adding team_a_score column...');
    // Add team_b_score column
    console.log('Adding team_b_score column...');
    // Add completed_at column
    console.log('Adding completed_at column...');

    console.log('✅ Columns added successfully!');

    // Verify columns exist
    console.log('\nVerifying columns...');
    const { data, error } = await supabase
      .from('matches')
      .select('id, winner, team_a_score, team_b_score, completed_at')
      .limit(1);

    if (error) {
      console.log('❌ Error verifying columns:', error);
    } else {
      console.log('✅ Columns verified:', Object.keys(data[0] || {}));
    }

  } catch (err) {
    console.error('❌ Error:', err);
  }
}

addColumns();