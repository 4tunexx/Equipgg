require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkColumns() {
  try {
    // Check if provider column exists
    const { error: providerError } = await supabase
      .from('users')
      .select('provider')
      .limit(1);

    if (providerError && providerError.code === '42703') {
      console.log('❌ Provider column missing from users table');
      console.log('📋 Run this SQL in Supabase SQL editor:');
      console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT \'email\';');
    } else {
      console.log('✅ Provider column exists');
    }

    // Check if matches table exists
    const { error: matchesError } = await supabase
      .from('matches')
      .select('id')
      .limit(1);

    if (matchesError) {
      console.log('❌ Matches table missing');
      console.log('📋 Run the create_matches_tables.sql script in Supabase SQL editor');
    } else {
      console.log('✅ Matches table exists');
    }

    // Check if user_bets table exists
    const { error: betsError } = await supabase
      .from('user_bets')
      .select('id')
      .limit(1);

    if (betsError) {
      console.log('❌ User_bets table missing');
      console.log('📋 Run the create_matches_tables.sql script in Supabase SQL editor');
    } else {
      console.log('✅ User_bets table exists');
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

checkColumns();