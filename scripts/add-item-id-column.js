const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addItemIdColumn() {
  try {
    console.log('Adding item_id column to activity_feed table...');
    
    // Execute raw SQL to add the column
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE activity_feed 
        ADD COLUMN IF NOT EXISTS item_id INTEGER REFERENCES items(id) ON DELETE SET NULL;
      `
    });

    if (error) {
      console.error('Error adding item_id column:', error);
      
      // Try direct SQL execution
      console.log('Trying direct SQL execution...');
      const { error: directError } = await supabase
        .from('activity_feed')
        .select('*')
        .limit(1);
      
      if (directError && directError.code === '42703') {
        console.log('Column does not exist, will create it manually...');
      }
    } else {
      console.log('Successfully added item_id column');
    }

  } catch (error) {
    console.error('Error in addItemIdColumn:', error);
  }
}

addItemIdColumn();