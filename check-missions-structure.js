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

async function checkMissionsStructure() {
    try {
        console.log('🔍 Checking missions table structure...');
        
        // Get all missions to see the structure
        const { data: missions, error } = await supabase
            .from('missions')
            .select('*')
            .limit(5);
            
        if (error) {
            console.error('❌ Error fetching missions:', error);
            return;
        }
        
        console.log('📊 Sample missions data:');
        console.log(JSON.stringify(missions, null, 2));
        
        if (missions && missions.length > 0) {
            console.log('\n🔧 Available columns:');
            console.log(Object.keys(missions[0]).join(', '));
        }
        
        // Get total count
        const { data: allMissions, error: countError } = await supabase
            .from('missions')
            .select('*', { count: 'exact' });
            
        if (countError) {
            console.error('❌ Error counting missions:', countError);
        } else {
            console.log(`\n📈 Total missions in database: ${allMissions.length}`);
        }
        
        // Check different mission types
        const { data: dailyMissions, error: dailyError } = await supabase
            .from('missions')
            .select('*')
            .eq('type', 'daily');
            
        if (!dailyError) {
            console.log(`📅 Daily missions: ${dailyMissions.length}`);
        }
        
        const { data: mainMissions, error: mainError } = await supabase
            .from('missions')
            .select('*')
            .eq('type', 'main');
            
        if (!mainError) {
            console.log(`🎯 Main missions: ${mainMissions.length}`);
        }
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

checkMissionsStructure();