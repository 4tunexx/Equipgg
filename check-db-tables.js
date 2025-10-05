import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  
  // Check for support_tickets table
  console.log('Checking support_tickets table...');
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .limit(1);
    if (error) {
      console.error('Support tickets table error:', error.message);
    } else {
      console.log('✅ support_tickets table exists');
    }
  } catch (e) {
    console.error('Support tickets table error:', e.message);
  }

  // Check for flash_sales table
  console.log('\nChecking flash_sales table...');
  try {
    const { data, error } = await supabase
      .from('flash_sales')
      .select('*')
      .limit(1);
    if (error) {
      console.error('Flash sales table error:', error.message);
    } else {
      console.log('✅ flash_sales table exists');
    }
  } catch (e) {
    console.error('Flash sales table error:', e.message);
  }

  // Check for notifications table
  console.log('\nChecking notifications table...');
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);
    if (error) {
      console.error('Notifications table error:', error.message);
    } else {
      console.log('✅ notifications table exists');
    }
  } catch (e) {
    console.error('Notifications table error:', e.message);
  }

  // Check user roles
  console.log('\nChecking user roles...');
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(5);
    if (error) {
      console.error('Users table error:', error.message);
    } else {
      console.log('✅ users table exists');
      console.log('Sample users:', users?.map(u => ({ email: u.email, role: u.role })));
    }
  } catch (e) {
    console.error('Users table error:', e.message);
  }
}

checkTables().catch(console.error);