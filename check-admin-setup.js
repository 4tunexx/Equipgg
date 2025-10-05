const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rntlmrwzgdqkyfbffsmb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdminSetup() {
    console.log('🔍 CHECKING ADMIN USER SETUP');
    console.log('============================');
    
    try {
        // Get all users with their roles
        const { data: users, error } = await supabase
            .from('users')
            .select('id, username, email, role, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.log('❌ Error fetching users:', error.message);
            return;
        }

        console.log(`📊 Total users: ${users.length}`);
        console.log('');

        // Check admin users
        const adminUsers = users.filter(user => user.role === 'admin');
        console.log(`👑 Admin users: ${adminUsers.length}`);
        
        if (adminUsers.length === 0) {
            console.log('⚠️  NO ADMIN USERS FOUND!');
            console.log('🔧 You need to manually set a user role to "admin" in Supabase');
            console.log('');
            
            // Show recent users
            console.log('📋 Recent users (candidates for admin):');
            users.slice(0, 5).forEach((user, index) => {
                console.log(`   ${index + 1}. ${user.username || 'No username'} (${user.email})`);
                console.log(`      ID: ${user.id}`);
                console.log(`      Role: ${user.role}`);
                console.log('');
            });
            
            console.log('🛠️  TO FIX:');
            console.log('1. Go to Supabase Dashboard → Table Editor → users');
            console.log('2. Find your user account');
            console.log('3. Edit the "role" column and change it from "user" to "admin"');
            console.log('4. Save the changes');
            console.log('5. Log out and log back in to refresh your session');
            
        } else {
            console.log('✅ Admin users found:');
            adminUsers.forEach((admin, index) => {
                console.log(`   ${index + 1}. ${admin.username || 'No username'} (${admin.email})`);
                console.log(`      ID: ${admin.id}`);
                console.log(`      Created: ${admin.created_at}`);
                console.log('');
            });
        }

        // Check role distribution
        const roleStats = {};
        users.forEach(user => {
            const role = user.role || 'null';
            roleStats[role] = (roleStats[role] || 0) + 1;
        });

        console.log('📈 Role distribution:');
        Object.entries(roleStats).forEach(([role, count]) => {
            console.log(`   ${role}: ${count} users`);
        });

        // Test admin API access simulation
        console.log('\n🧪 Testing admin API requirements...');
        
        if (adminUsers.length > 0) {
            const testAdmin = adminUsers[0];
            console.log(`✅ Admin user available for testing: ${testAdmin.username || testAdmin.email}`);
            console.log('✅ Admin role properly set in database');
            console.log('✅ Admin API endpoints should work');
            
            console.log('\n🎯 NEXT STEPS:');
            console.log('1. Make sure you are logged in as the admin user');
            console.log('2. Clear browser cache/cookies if needed');
            console.log('3. Try the admin panel operations again');
            console.log('4. Use browser dev tools to check for errors');
            
        } else {
            console.log('❌ No admin users - API will reject all admin operations');
            console.log('⚠️  Set up admin user first (see instructions above)');
        }

    } catch (error) {
        console.error('❌ Error checking admin setup:', error.message);
    }
}

async function setUserAsAdmin() {
    console.log('\n🛠️  ADMIN USER SETUP HELPER');
    console.log('===========================');
    
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, username, email, role')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.log('❌ Error fetching users:', error.message);
            return;
        }

        console.log('📋 Recent users:');
        users.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.username || 'No username'} (${user.email})`);
            console.log(`      ID: ${user.id}`);
            console.log(`      Current role: ${user.role}`);
            console.log('');
        });

        // Auto-promote first user to admin if no admins exist
        const adminUsers = users.filter(u => u.role === 'admin');
        
        if (adminUsers.length === 0 && users.length > 0) {
            const firstUser = users[0];
            console.log(`🔧 Auto-promoting first user to admin: ${firstUser.username || firstUser.email}`);
            
            const { error: updateError } = await supabase
                .from('users')
                .update({ role: 'admin' })
                .eq('id', firstUser.id);

            if (updateError) {
                console.log('❌ Failed to promote user:', updateError.message);
            } else {
                console.log('✅ User promoted to admin successfully!');
                console.log('🔄 Please log out and log back in to refresh your session');
            }
        }

    } catch (error) {
        console.error('❌ Error setting up admin:', error.message);
    }
}

async function main() {
    await checkAdminSetup();
    await setUserAsAdmin();
}

main().catch(console.error);