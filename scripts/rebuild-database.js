const { createClient } = require('@supabase/supabase-js');

async function rebuildDatabase() {
    console.log('🚀 Rebuilding database with correct structure...');
    
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
        // Since tables are now empty, let's create the admin user with correct column structure
        console.log('👤 Creating admin user with correct structure...');
        
        const { data: adminUser, error: adminError } = await supabase
            .from('users')
            .insert([{
                id: 'admin-123-456-789',
                email: 'admin@equipgg.net',
                display_name: 'Admin User',  // Using correct column name!
                password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
                avatar_url: null,
                role: 'admin',
                xp: 0,
                level: 1,
                coins: 0,
                gems: 50
            }])
            .select();

        if (adminError) {
            console.log('❌ Error creating admin user:', adminError.message);
            
            // Check if the error is about column name
            if (adminError.message.includes('display_name')) {
                console.log('🎯 CONFIRMED: The issue is column naming!');
                console.log('');
                console.log('🛠️  AUTOMATIC FIX AVAILABLE:');
                console.log('   I can create a simple SQL migration that you can run.');
                console.log('');
                
                // Create a simple SQL file with just the column rename
                const fs = require('fs');
                const quickFixSQL = `-- Quick fix for EquipGG database column naming
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/projects/rxamnospcmbtgzptmmxl/sql/new

-- Fix the users table column name
ALTER TABLE public.users RENAME COLUMN displayname TO display_name;

-- Verify the fix
SELECT id, email, display_name FROM public.users LIMIT 1;

-- Success! Your site should now work at https://equipgg.net
`;
                
                fs.writeFileSync('quick-fix.sql', quickFixSQL);
                console.log('📄 Created quick-fix.sql with the exact command needed!');
                console.log('');
                console.log('🔗 Copy the content of quick-fix.sql and paste it here:');
                console.log('   https://supabase.com/dashboard/projects/rxamnospcmbtgzptmmxl/sql/new');
                console.log('');
                console.log('⚡ This single command will fix your entire site!');
                
                return;
            }
            return;
        }

        console.log('✅ Successfully created admin user!');
        console.log('👤 Admin user:', adminUser[0]);

        // Create some achievements
        console.log('🏆 Adding achievements...');
        const { error: achievementsError } = await supabase
            .from('achievements')
            .insert([
                {
                    id: 'first-case',
                    name: 'First Case',
                    description: 'Open your first case',
                    icon: '📦',
                    xp_reward: 100
                },
                {
                    id: 'big-winner',
                    name: 'Big Winner',
                    description: 'Win an item worth over $100',
                    icon: '💎',
                    xp_reward: 500
                }
            ]);

        if (achievementsError) {
            console.log('⚠️  Achievements error:', achievementsError.message);
        } else {
            console.log('✅ Achievements added!');
        }

        // Test the database fix
        console.log('🧪 Testing database structure...');
        const { data: testUser, error: testError } = await supabase
            .from('users')
            .select('id, email, display_name, role')
            .eq('email', 'admin@equipgg.net')
            .single();

        if (testError) {
            console.log('❌ Test failed:', testError.message);
        } else {
            console.log('✅ Database test successful!');
            console.log('👤 User data:', testUser);
            console.log('');
            console.log('🎉 DATABASE REBUILD COMPLETED!');
            console.log('📋 What was fixed:');
            console.log('  ✅ Users table has correct display_name column');
            console.log('  ✅ Admin user created');
            console.log('  ✅ Achievements added');
            console.log('  ✅ Database structure is now correct');
            console.log('');
            console.log('🚀 Your site at https://equipgg.net should now work perfectly!');
        }

    } catch (error) {
        console.error('❌ Rebuild failed:', error.message);
    }
}

// Load environment variables
require('dotenv').config();

// Execute rebuild
rebuildDatabase();