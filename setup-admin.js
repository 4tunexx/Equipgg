const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupAdmin() {
  try {
    // Check for existing admin users
    const { data: admins, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin');

    if (adminError) {
      console.error('Error checking admin users:', adminError);
      return;
    }

    console.log('Current admin users:', admins?.length || 0);
    
    if (admins && admins.length > 0) {
      console.log('Admin users found:');
      admins.forEach(admin => {
        console.log(`- ${admin.email} (ID: ${admin.id})`);
      });
    } else {
      console.log('No admin users found.');
      
      // Get the first user and make them admin
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(5);

      if (usersError) {
        console.error('Error fetching users:', usersError);
        return;
      }

      if (users && users.length > 0) {
        console.log('\nAvailable users:');
        users.forEach((user, index) => {
          console.log(`${index + 1}. ${user.email} (Role: ${user.role || 'user'})`);
        });
        
        // Make the first user an admin
        const firstUser = users[0];
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: 'admin' })
          .eq('id', firstUser.id);

        if (updateError) {
          console.error('Error updating user role:', updateError);
        } else {
          console.log(`\n✅ Successfully made ${firstUser.email} an admin!`);
        }
      } else {
        console.log('No users found in the database.');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

setupAdmin();