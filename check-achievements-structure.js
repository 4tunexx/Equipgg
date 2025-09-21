const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAchievementsStructure() {
    try {
        console.log('🔍 Checking achievements table structure...');
        
        // Get all achievements to see the structure
        const { data: achievements, error } = await supabase
            .from('achievements')
            .select('*')
            .limit(5);
            
        if (error) {
            console.error('❌ Error fetching achievements:', error);
            return;
        }
        
        console.log('📊 Sample achievements data:');
        console.log(JSON.stringify(achievements, null, 2));
        
        if (achievements && achievements.length > 0) {
            console.log('\n🔧 Available columns:');
            console.log(Object.keys(achievements[0]).join(', '));
        }
        
        // Get total count
        const { data: allAchievements, error: countError } = await supabase
            .from('achievements')
            .select('*', { count: 'exact' });
            
        if (countError) {
            console.error('❌ Error counting achievements:', countError);
        } else {
            console.log(`\n📈 Total achievements in database: ${allAchievements.length}`);
        }
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

checkAchievementsStructure();