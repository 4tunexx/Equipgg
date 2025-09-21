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

async function checkBadgesStructure() {
    try {
        console.log('🔍 Checking badges table structure...');
        
        // Get all badges to see the structure
        const { data: badges, error } = await supabase
            .from('badges')
            .select('*')
            .limit(5);
            
        if (error) {
            console.error('❌ Error fetching badges:', error);
            return;
        }
        
        console.log('📊 Sample badges data:');
        console.log(JSON.stringify(badges, null, 2));
        
        if (badges && badges.length > 0) {
            console.log('\n🔧 Available columns:');
            console.log(Object.keys(badges[0]).join(', '));
        }
        
        // Get total count
        const { data: allBadges, error: countError } = await supabase
            .from('badges')
            .select('*', { count: 'exact' });
            
        if (countError) {
            console.error('❌ Error counting badges:', countError);
        } else {
            console.log(`\n📈 Total badges in database: ${allBadges.length}`);
        }
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

checkBadgesStructure();