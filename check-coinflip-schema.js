const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCoinflipSchema() {
  console.log('Checking coinflip_lobbies table schema...');
  
  try {
    // Get table schema information
    const { data, error } = await supabase
      .from('coinflip_lobbies')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log('Table exists with data sample:', data);
    
    // Try to get all columns by querying information_schema
    const { data: schemaData, error: schemaError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'coinflip_lobbies' 
        ORDER BY ordinal_position;
      `
    });
    
    if (schemaError) {
      console.log('Schema query error (expected):', schemaError.message);
      console.log('Trying alternative approach...');
      
      // Try to insert a minimal record to see what columns are required
      const testData = {
        id: 'test_schema_check',
        status: 'waiting'
      };
      
      const { error: insertError } = await supabase
        .from('coinflip_lobbies')
        .insert([testData]);
      
      if (insertError) {
        console.log('Insert error reveals required columns:', insertError.message);
      }
      
      // Clean up test record
      await supabase
        .from('coinflip_lobbies')
        .delete()
        .eq('id', 'test_schema_check');
        
    } else {
      console.log('Table schema:');
      schemaData.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
  } catch (error) {
    console.error('General error:', error);
  }
}

checkCoinflipSchema();