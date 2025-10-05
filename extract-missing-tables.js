const fs = require('fs');

// Missing tables identified from the test
const missingTables = [
    'crate_openings',      // line 111 (we have crate_items, need crate_openings)
    'game_history',        // line 234 (trade_history equivalent)
    'steam_trade_offers',  // line 551 (trade_offer_items equivalent) 
    'match_votes',         // line 368 (match_predictions equivalent)
    'admin_logs',          // line 29 (audit_logs equivalent)
    'payment_intents',     // line 429 (withdrawal_requests equivalent)
    'forum_categories',    // line 186 (market_items equivalent)
    'cs2_skins',           // line 152 (steam_items equivalent) 
    'server_seeds',        // line 510 (provably_fair_seeds equivalent)
    'flash_sales',         // line 174 (giveaways equivalent)
    'user_rewards',        // line 757 (referrals equivalent)
    'user_perks'           // line 735 (daily_bonuses equivalent)
];

// Map test names to actual table names in schema
const tableMapping = {
    'case_openings': 'crate_openings',
    'trade_history': 'game_history', 
    'trade_offer_items': 'steam_trade_offers',
    'match_predictions': 'match_votes',
    'audit_logs': 'admin_logs',
    'withdrawal_requests': 'payment_intents',
    'market_items': 'forum_categories',
    'steam_items': 'cs2_skins',
    'provably_fair_seeds': 'server_seeds',
    'giveaways': 'flash_sales',
    'referrals': 'user_rewards',
    'daily_bonuses': 'user_perks'
};

function extractTableDefinitions() {
    const content = fs.readFileSync('all2.txt', 'utf8');
    const lines = content.split('\n');
    
    let sqlStatements = [];
    sqlStatements.push('-- MISSING TABLES SQL FIX');
    sqlStatements.push('-- Add all missing tables to complete the database schema');
    sqlStatements.push('-- Execute these statements in Supabase Dashboard -> SQL Editor\n');
    
    for (const tableName of missingTables) {
        console.log(`🔍 Extracting ${tableName}...`);
        
        // Find the CREATE TABLE line
        const createLineIndex = lines.findIndex(line => 
            line.includes(`CREATE TABLE public.${tableName}`)
        );
        
        if (createLineIndex === -1) {
            console.log(`❌ Table ${tableName} not found in schema`);
            continue;
        }
        
        // Extract the complete table definition
        let tableDefinition = [];
        let braceCount = 0;
        let startCollecting = false;
        
        for (let i = createLineIndex; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.includes('CREATE TABLE')) {
                startCollecting = true;
            }
            
            if (startCollecting) {
                tableDefinition.push(line);
                
                // Count braces to know when table definition ends
                braceCount += (line.match(/\(/g) || []).length;
                braceCount -= (line.match(/\)/g) || []).length;
                
                // If we hit the closing brace and semicolon
                if (braceCount === 0 && line.includes(');')) {
                    break;
                }
            }
        }
        
        if (tableDefinition.length > 0) {
            sqlStatements.push(`-- Table: ${tableName}`);
            sqlStatements.push(tableDefinition.join('\n'));
            sqlStatements.push('');
            console.log(`✅ Extracted ${tableName} (${tableDefinition.length} lines)`);
        } else {
            console.log(`❌ Failed to extract ${tableName}`);
        }
    }
    
    // Write the SQL file
    const sqlContent = sqlStatements.join('\n');
    fs.writeFileSync('MISSING_TABLES_FIXES.sql', sqlContent);
    
    console.log(`\n📝 Created MISSING_TABLES_FIXES.sql with ${missingTables.length} table definitions`);
    console.log(`\n📋 Table mappings for reference:`);
    Object.entries(tableMapping).forEach(([testName, actualName]) => {
        console.log(`   ${testName} → ${actualName}`);
    });
}

extractTableDefinitions();