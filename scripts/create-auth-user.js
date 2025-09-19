const { createClient } = require('@supabase/supabase-js');

async function createAuthUser() {
    console.log('🔐 Creating proper authenticated user...');
    
    // Load environment variables
    require('dotenv').config();
    
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    try {
        // Create a user through Supabase Auth (this will work for login)
        console.log('👤 Creating admin user through Supabase Auth...');
        
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: 'admin@equipgg.net',
            password: 'admin123',
            email_confirm: true,
            user_metadata: {
                displayName: 'Admin User'
            }
        });

        if (authError) {
            if (authError.message.includes('already exists')) {
                console.log('✅ User already exists in auth system');
                
                // Try to get the existing user
                const { data: users, error: listError } = await supabase.auth.admin.listUsers();
                if (!listError && users) {
                    const existingUser = users.users.find(u => u.email === 'admin@equipgg.net');
                    if (existingUser) {
                        console.log('👤 Found existing user:', existingUser.id);
                        
                        // Update their password to make sure it works
                        const { error: updateError } = await supabase.auth.admin.updateUserById(
                            existingUser.id,
                            { password: 'admin123' }
                        );
                        
                        if (updateError) {
                            console.log('⚠️  Could not update password:', updateError.message);
                        } else {
                            console.log('✅ Password updated successfully');
                        }
                        
                        await updateUserTable(supabase, existingUser.id);
                        return;
                    }
                }
            } else {
                console.log('❌ Auth user creation failed:', authError.message);
                return;
            }
        } else {
            console.log('✅ Auth user created successfully!');
            console.log('👤 User ID:', authData.user.id);
            console.log('📧 Email:', authData.user.email);
            
            await updateUserTable(supabase, authData.user.id);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function updateUserTable(supabase, userId) {
    console.log('📝 Updating users table with auth user ID...');
    
    // Check if user exists in users table
    const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'admin@equipgg.net')
        .single();

    if (existingUser) {
        // Update existing user with the auth user ID
        const { error: updateError } = await supabase
            .from('users')
            .update({ 
                id: userId,  // Update to use the auth user ID
                displayname: 'Admin User',
                role: 'admin',
                coins: 1000,
                gems: 100,
                xp: 0,
                level: 1
            })
            .eq('email', 'admin@equipgg.net');

        if (updateError) {
            console.log('⚠️  Update error:', updateError.message);
            
            // If update fails, delete and recreate
            await supabase.from('users').delete().eq('email', 'admin@equipgg.net');
            await createNewUserRecord(supabase, userId);
        } else {
            console.log('✅ User table updated with auth ID');
        }
    } else {
        await createNewUserRecord(supabase, userId);
    }
}

async function createNewUserRecord(supabase, userId) {
    console.log('🆕 Creating new user record...');
    
    const { data, error } = await supabase
        .from('users')
        .insert([{
            id: userId,  // Use the auth user ID
            email: 'admin@equipgg.net',
            displayname: 'Admin User',
            role: 'admin',
            coins: 1000,
            gems: 100,
            xp: 0,
            level: 1
        }])
        .select();

    if (error) {
        console.log('❌ User record creation failed:', error.message);
    } else {
        console.log('✅ User record created successfully!');
        console.log('👤 User data:', data[0]);
    }
}

async function testLogin() {
    console.log('');
    console.log('🧪 Testing login credentials...');
    
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY  // Use anon key for auth
    );

    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@equipgg.net',
        password: 'admin123'
    });

    if (error) {
        console.log('❌ Login test failed:', error.message);
    } else {
        console.log('✅ Login test successful!');
        console.log('👤 Logged in user:', data.user.email);
        console.log('🔑 Session created:', !!data.session);
    }
}

// Execute
createAuthUser().then(() => {
    console.log('');
    console.log('🎉 AUTHENTICATION SETUP COMPLETE!');
    console.log('📋 Login credentials:');
    console.log('   Email: admin@equipgg.net');
    console.log('   Password: admin123');
    console.log('');
    console.log('🚀 You can now login at https://equipgg.net');
    
    // Test the login
    return testLogin();
}).catch(console.error);