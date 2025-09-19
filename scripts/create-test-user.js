const { createClient } = require('@supabase/supabase-js');

async function createTestUser() {
    console.log('👥 Creating regular test user...');
    
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
        // Create test user through Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: 'test@equipgg.net',
            password: 'test123',
            email_confirm: true,
            user_metadata: {
                displayName: 'Test User'
            }
        });

        if (authError) {
            if (authError.message.includes('already exists')) {
                console.log('✅ Test user already exists');
                return;
            } else {
                console.log('❌ Auth user creation failed:', authError.message);
                return;
            }
        }

        console.log('✅ Test user created in auth system');
        console.log('👤 User ID:', authData.user.id);

        // Create user record in users table
        const { data, error } = await supabase
            .from('users')
            .insert([{
                id: authData.user.id,
                email: 'test@equipgg.net',
                displayname: 'Test User',
                role: 'user',
                coins: 500,
                gems: 25,
                xp: 0,
                level: 1
            }])
            .select();

        if (error) {
            console.log('❌ User record creation failed:', error.message);
        } else {
            console.log('✅ Test user record created!');
            console.log('👤 User data:', data[0]);
        }

        // Test login for the new user
        console.log('🧪 Testing test user login...');
        
        const testSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        const { data: loginData, error: loginError } = await testSupabase.auth.signInWithPassword({
            email: 'test@equipgg.net',
            password: 'test123'
        });

        if (loginError) {
            console.log('❌ Test user login failed:', loginError.message);
        } else {
            console.log('✅ Test user login successful!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

createTestUser().then(() => {
    console.log('');
    console.log('🎉 TEST USER SETUP COMPLETE!');
    console.log('📋 Available accounts:');
    console.log('');
    console.log('👑 Admin Account:');
    console.log('   Email: admin@equipgg.net');
    console.log('   Password: admin123');
    console.log('   Role: admin');
    console.log('   Coins: 1000, Gems: 100');
    console.log('');
    console.log('👤 Test Account:');
    console.log('   Email: test@equipgg.net');
    console.log('   Password: test123');
    console.log('   Role: user');
    console.log('   Coins: 500, Gems: 25');
    console.log('');
    console.log('🚀 Login at: https://equipgg.net');
}).catch(console.error);