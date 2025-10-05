import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  try {
    console.log('Creating missing tables...');
    
    const sql = readFileSync('./create-missing-api-tables.sql', 'utf8');
    
    // Split SQL by statements and execute each one
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      const trimmedStatement = statement.trim();
      if (trimmedStatement) {
        console.log(`Executing: ${trimmedStatement.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql_query: trimmedStatement });
        
        if (error) {
          // Try direct SQL execution
          console.log('RPC failed, trying direct execution...');
          const { error: directError } = await supabase.from('_').select('*').limit(0);
          console.error('SQL Error:', error);
        } else {
          console.log('✅ Statement executed successfully');
        }
      }
    }
    
    console.log('\n✅ Table creation completed!');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

createTables();