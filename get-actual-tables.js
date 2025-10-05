const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rntlmrwzgdqkyfbffsmb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getActualTables() {
    console.log('🔍 Finding tables that actually exist in Supabase...\n');

    // Test common tables to see which ones actually exist
    const tablesToTest = [
        'users', 'items', 'matches', 'trade_offers', 'achievements', 'badges', 
        'missions', 'crates', 'notifications', 'support_tickets', 'user_inventory',
        'user_achievements', 'user_missions', 'transactions', 'case_openings',
        'trade_history', 'trade_offer_items', 'match_predictions', 'audit_logs',
        'withdrawal_requests', 'user_badges', 'crate_items', 'market_items',
        'steam_items', 'user_stats', 'provably_fair_seeds', 'giveaways',
        'chat_messages', 'referrals', 'daily_bonuses'
    ];

    const existingTables = [];
    const missingTables = [];

    console.log('📊 Testing table accessibility...\n');

    for (const table of tablesToTest) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);

            if (error) {
                if (error.message.includes('schema cache')) {
                    missingTables.push(table);
                    console.log(`❌ ${table}: NOT FOUND`);
                } else {
                    existingTables.push(table);
                    console.log(`⚠️  ${table}: EXISTS (but error: ${error.message})`);
                }
            } else {
                existingTables.push(table);
                console.log(`✅ ${table}: EXISTS (${data.length} records)`);
            }
        } catch (err) {
            missingTables.push(table);
            console.log(`❌ ${table}: ERROR (${err.message})`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Existing tables (${existingTables.length}):`);
    existingTables.forEach(table => console.log(`   - ${table}`));
    
    console.log(`\n❌ Missing tables (${missingTables.length}):`);
    missingTables.forEach(table => console.log(`   - ${table}`));

    return { existingTables, missingTables };
}

getActualTables().catch(console.error);