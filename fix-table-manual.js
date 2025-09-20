const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixTableManually() {
  try {
    console.log('🔧 Manually fixing users table...');
    
    // Step 1: Add missing columns one by one
    console.log('➕ Adding username column...');
    try {
      await supabase.rpc('alter_table_add_column', {
        table_name: 'users',
        column_name: 'username',
        column_type: 'TEXT'
      });
    } catch (e) {
      // Column might already exist, try direct approach
      console.log('Using direct SQL approach...');
    }
    
    // Let's try a different approach - use the pg client directly
    console.log('📊 Getting current users and updating...');
    
    // Get all users
    const { data: users, error: getUsersError } = await supabase
      .from('users')
      .select('*');
    
    if (getUsersError) {
      console.error('❌ Error getting users:', getUsersError.message);
      return;
    }
    
    console.log(`📋 Found ${users.length} users to update`);
    
    // Update each user record to match expected format
    for (const user of users) {
      const updateData = {
        // Map old fields to new expected fields
        username: user.displayname || user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`,
        balance: user.coins || 1000,
        is_admin: user.role === 'admin',
        is_moderator: user.role === 'moderator',
        is_vip: user.role === 'vip',
        updated_at: new Date().toISOString()
      };
      
      console.log(`🔄 Updating user ${user.email}...`);
      
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);
      
      if (updateError) {
        console.error(`❌ Failed to update ${user.email}:`, updateError.message);
      } else {
        console.log(`✅ Updated ${user.email}`);
      }
    }
    
    // Now sync auth users
    console.log('\n🔄 Syncing auth users...');
    const { data: authResult, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Failed to get auth users:', authError.message);
      return;
    }
    
    const authUsers = authResult.users || [];
    
    for (const authUser of authUsers) {
      // Check if user exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .single();
      
      if (checkError && checkError.code === 'PGRST116') {
        // User doesn't exist, create them
        const userData = {
          id: authUser.id,
          email: authUser.email,
          username: authUser.user_metadata?.username || 
                   authUser.user_metadata?.name ||
                   authUser.email?.split('@')[0] || 
                   `user_${authUser.id.substring(0, 8)}`,
          steam_id: authUser.user_metadata?.steam_id || null,
          avatar_url: authUser.user_metadata?.avatar_url || null,
          balance: 1000,
          gems: 50,
          xp: 0,
          level: 1,
          is_admin: false,
          is_moderator: false,
          is_vip: false
        };
        
        console.log(`➕ Creating user ${userData.username}...`);
        
        const { error: insertError } = await supabase
          .from('users')
          .insert([userData]);
        
        if (insertError) {
          console.error(`❌ Failed to create ${userData.username}:`, insertError.message);
        } else {
          console.log(`✅ Created ${userData.username}`);
        }
      }
    }
    
    // Final verification
    const { data: finalUsers, error: finalError } = await supabase
      .from('users')
      .select('id, username, email, balance, is_admin')
      .limit(10);
    
    if (!finalError) {
      console.log('\n✅ Final users table state:');
      finalUsers.forEach(user => {
        console.log(`👤 ${user.username} (${user.email}) - Balance: ${user.balance} - Admin: ${user.is_admin}`);
      });
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

fixTableManually();