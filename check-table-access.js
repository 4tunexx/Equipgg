const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rntlmrwzgdqkyfbffsmb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableAccess() {
    console.log('🔍 Checking direct table access...\n');

    const problematicTables = [
        'trade_history',
        'trade_offer_items', 
        'match_predictions',
        'case_openings',
        'audit_logs',
        'withdrawal_requests'
    ];

    for (const tableName of problematicTables) {
        console.log(`📋 Testing ${tableName}:`);
        
        try {
            // Try to get table info using pg_tables
            const { data: tableExists, error: tableError } = await supabase
                .rpc('exec_sql', { 
                    sql: `SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = '${tableName}'
                    );`
                });

            if (tableError) {
                console.log(`   ❌ RPC Error: ${tableError.message}`);
            } else {
                console.log(`   📊 Table exists in schema: ${tableExists ? 'YES' : 'NO'}`);
            }

            // Try direct access
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);

            if (error) {
                console.log(`   ❌ Direct access error: ${error.message}`);
                
                // Check if it's a permission issue or missing table
                if (error.message.includes('schema cache')) {
                    console.log(`   💡 Suggestion: Table may need to be created manually`);
                } else if (error.message.includes('permission')) {
                    console.log(`   💡 Suggestion: Permission issue - check RLS policies`);
                }
            } else {
                console.log(`   ✅ Direct access successful - ${data.length} records`);
            }
        } catch (err) {
            console.log(`   ❌ Exception: ${err.message}`);
        }
        
        console.log('');
    }

    // Check if we can create one of the missing tables
    console.log('🛠️  Testing table creation capability...');
    
    try {
        const { data, error } = await supabase
            .rpc('exec_sql', { 
                sql: `CREATE TABLE IF NOT EXISTS test_table_creation (
                    id SERIAL PRIMARY KEY,
                    test_column TEXT
                );`
            });

        if (error) {
            console.log(`❌ Cannot create tables: ${error.message}`);
        } else {
            console.log(`✅ Table creation capability confirmed`);
            
            // Clean up test table
            await supabase.rpc('exec_sql', { 
                sql: `DROP TABLE IF EXISTS test_table_creation;`
            });
        }
    } catch (err) {
        console.log(`❌ Table creation test failed: ${err.message}`);
    }
}

checkTableAccess().catch(console.error);