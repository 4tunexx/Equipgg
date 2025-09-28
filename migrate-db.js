require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  try {
    const sql = fs.readFileSync('complete_database_schema.sql', 'utf8');

    // Split by CREATE TABLE statements and execute them individually
    const createTableStatements = sql.split(/CREATE TABLE/g).filter(s => s.trim());

    console.log(`Found ${createTableStatements.length} CREATE TABLE statements...`);

    for (let i = 0; i < createTableStatements.length; i++) {
      const statement = 'CREATE TABLE' + createTableStatements[i].trim();
      if (statement.includes('CREATE TABLE IF NOT EXISTS')) {
        console.log(`Executing statement ${i + 1}/${createTableStatements.length}...`);
        try {
          // For CREATE TABLE statements, we can't use the REST API
          // We'll need to execute these via SQL directly
          console.log(`Would execute: ${statement.substring(0, 100)}...`);
        } catch (err) {
          console.error(`Failed statement ${i + 1}:`, err);
        }
      }
    }

    // Try to execute some basic operations to test connection
    console.log('Testing database connection...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('Database connection test failed:', error);
    } else {
      console.log('Database connection successful');
    }

  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration();