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

async function checkRanksStructure() {
    try {
        console.log('🔍 Checking ranks table structure...');
        
        // Get all ranks to see the structure
        const { data: ranks, error } = await supabase
            .from('ranks')
            .select('*')
            .limit(5);
            
        if (error) {
            console.error('❌ Error fetching ranks:', error);
            return;
        }
        
        console.log('📊 Sample ranks data:');
        console.log(JSON.stringify(ranks, null, 2));
        
        if (ranks && ranks.length > 0) {
            console.log('\n🔧 Available columns:');
            console.log(Object.keys(ranks[0]).join(', '));
        }
        
        // Get total count
        const { data: allRanks, error: countError } = await supabase
            .from('ranks')
            .select('*', { count: 'exact' });
            
        if (countError) {
            console.error('❌ Error counting ranks:', countError);
        } else {
            console.log(`\n📈 Total ranks in database: ${allRanks.length}`);
        }
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

checkRanksStructure();