const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rntlmrwzgdqkyfbffsmb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSpecificTables() {
    console.log('🔍 Checking which tables from MISSING_TABLES_FIXES.sql actually need to be created...\n');

    const tablesToCheck = [
        'crate_openings',
        'game_history', 
        'steam_trade_offers',
        'match_votes',
        'admin_logs',
        'payment_intents',
        'forum_categories',
        'cs2_skins',
        'server_seeds',
        'flash_sales',
        'user_rewards',
        'user_perks'
    ];

    const existingTables = [];
    const trulyMissingTables = [];

    console.log('📊 Testing each table...\n');

    for (const table of tablesToCheck) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);

            if (error) {
                if (error.message.includes('schema cache') || error.message.includes('does not exist')) {
                    trulyMissingTables.push(table);
                    console.log(`❌ ${table}: MISSING - needs to be created`);
                } else {
                    existingTables.push(table);
                    console.log(`⚠️  ${table}: EXISTS but has access issue: ${error.message}`);
                }
            } else {
                existingTables.push(table);
                console.log(`✅ ${table}: EXISTS and accessible (${data.length} records)`);
            }
        } catch (err) {
            trulyMissingTables.push(table);
            console.log(`❌ ${table}: ERROR - ${err.message}`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Existing tables (${existingTables.length}):`);
    existingTables.forEach(table => console.log(`   - ${table}`));
    
    console.log(`\n❌ Truly missing tables (${trulyMissingTables.length}):`);
    trulyMissingTables.forEach(table => console.log(`   - ${table}`));

    if (trulyMissingTables.length === 0) {
        console.log('\n🎉 All tables already exist! No SQL execution needed.');
        console.log('✅ You can proceed directly to running the functionality test.');
    } else {
        console.log(`\n🛠️  Need to create ${trulyMissingTables.length} tables.`);
        console.log('📝 Will generate CORRECTED_MISSING_TABLES.sql with only the missing ones.');
    }

    return { existingTables, trulyMissingTables };
}

checkSpecificTables().catch(console.error);