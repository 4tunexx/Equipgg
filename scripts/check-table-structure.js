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

async function checkTableStructure() {
  try {
    console.log('Checking activity_feed table structure...');
    
    // Get a real user first
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username')
      .limit(1);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    console.log('Found user:', users[0]);
    const realUserId = users[0].id;

    // Try to select all columns
    const { data, error } = await supabase
      .from('activity_feed')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error accessing table:', error);
      return;
    }

    console.log('Table data sample:', data);
    
    if (data && data.length > 0) {
      console.log('Available columns:', Object.keys(data[0]));
    }

    // Try to insert a test record with just required columns
    const { data: insertData, error: insertError } = await supabase
      .from('activity_feed')
      .insert([{
        user_id: realUserId,
        action: 'test_action',
        created_at: new Date().toISOString()
      }])
      .select();

    if (insertError) {
      console.error('Error inserting test data:', insertError);
    } else {
      console.log('Test insert successful:', insertData);
      
      // Clean up test data
      if (insertData && insertData[0]) {
        await supabase
          .from('activity_feed')
          .delete()
          .eq('id', insertData[0].id);
        console.log('Test data cleaned up');
      }
    }

  } catch (error) {
    console.error('Error in checkTableStructure:', error);
  }
}

checkTableStructure();