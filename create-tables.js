require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runSQL() {
  try {
    const sql = fs.readFileSync('create_matches_tables.sql', 'utf8');
    console.log('Executing SQL to create matches and user_rewards tables...');

    // Split SQL into individual statements
    const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          console.log('Executing statement...');
          // Note: Supabase doesn't have a direct exec_sql function
          // We'll need to run this manually in the Supabase dashboard
          console.log(statement.trim());
        } catch (stmtError) {
          console.error('Error with statement:', stmtError);
        }
      }
    }

    console.log('\n=== SQL to run in Supabase SQL Editor ===');
    console.log(sql);
    console.log('\nPlease copy and paste the above SQL into your Supabase SQL Editor and run it.');

  } catch (err) {
    console.error('Failed to read SQL file:', err);
  }
}

runSQL();