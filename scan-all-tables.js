const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://rxamnospcmbtgzptmmxl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4YW1ub3NwY21idGd6cHRtbXhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA1NjgzOSwiZXhwIjoyMDczNjMyODM5fQ.TLkG3Dgrp0QAq_APeXrukFcrR4Eof15miMYynWFxqMc'
);

async function scanAllTables() {
  console.log('🔍 SCANNING ALL DATABASE TABLES AND COLUMNS\n');

  // Tables used in codebase
  const tables = [
    'users',
    'items', 
    'missions',
    'achievements',
    'user_achievements',
    'crates',
    'crate_items',
    'matches',
    'ranks',
    'perks',
    'badges',
    'user_badges',
    'user_inventory',
    'user_missions',
    'user_mission_progress',
    'activity_feed',
    'site_settings',
    'landing_panels',
    'game_history',
    'notifications',
    'shop_items',
    'user_transactions',
    'user_bets',
    'user_keys',
    'chat_messages',
    'gem_packages',
    'flash_sales',
    'user_rewards',
    'support_tickets',
    'admin_logs'
  ];

  const missing = [];
  const existing = [];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        missing.push(table);
        console.log(`❌ ${table.padEnd(30)} MISSING`);
      } else {
        existing.push(table);
        // Get sample row to see columns
        const { data: sample } = await supabase.from(table).select('*').limit(1);
        const columns = sample && sample[0] ? Object.keys(sample[0]) : [];
        console.log(`✅ ${table.padEnd(30)} EXISTS (${count || 0} rows) - Columns: ${columns.length}`);
      }
    } catch (e) {
      missing.push(table);
      console.log(`❌ ${table.padEnd(30)} ERROR`);
    }
  }

  console.log(`\n📊 SUMMARY:`);
  console.log(`✅ Existing: ${existing.length} tables`);
  console.log(`❌ Missing: ${missing.length} tables`);
  
  if (missing.length > 0) {
    console.log(`\n⚠️  MISSING TABLES:\n${missing.map(t => `   - ${t}`).join('\n')}`);
  }

  // Check critical columns
  console.log(`\n\n🔍 CHECKING CRITICAL COLUMNS...\n`);

  // Check users table columns
  const { data: userSample } = await supabase.from('users').select('*').limit(1);
  if (userSample && userSample[0]) {
    const userCols = Object.keys(userSample[0]);
    console.log('users table columns:', userCols.join(', '));
    
    const requiredUserCols = ['id', 'email', 'username', 'displayname', 'role', 'coins', 'gems', 'xp', 'level', 'avatar_url'];
    const missingUserCols = requiredUserCols.filter(col => !userCols.includes(col));
    if (missingUserCols.length > 0) {
      console.log(`❌ Missing columns in users: ${missingUserCols.join(', ')}`);
    } else {
      console.log('✅ All required user columns exist');
    }
  }

  // Check items table columns
  const { data: itemSample } = await supabase.from('items').select('*').limit(1);
  if (itemSample && itemSample[0]) {
    const itemCols = Object.keys(itemSample[0]);
    console.log('\nitems table columns:', itemCols.join(', '));
    
    const requiredItemCols = ['id', 'name', 'rarity', 'image_url'];
    const missingItemCols = requiredItemCols.filter(col => !itemCols.includes(col));
    if (missingItemCols.length > 0) {
      console.log(`❌ Missing columns in items: ${missingItemCols.join(', ')}`);
    } else {
      console.log('✅ All required item columns exist');
    }
  }

  // Check matches table
  const { data: matchSample } = await supabase.from('matches').select('*').limit(1);
  if (matchSample && matchSample[0]) {
    const matchCols = Object.keys(matchSample[0]);
    console.log('\nmatches table columns:', matchCols.join(', '));
  } else {
    console.log('\nmatches table is empty - checking structure...');
    const { error } = await supabase.from('matches').insert({ 
      team_a_name: 'TEST', 
      team_b_name: 'TEST',
      team_a_odds: 1.5,
      team_b_odds: 2.5,
      status: 'upcoming'
    });
    if (error) {
      console.log('❌ matches table structure issue:', error.message);
    }
  }
}

scanAllTables().catch(console.error);
