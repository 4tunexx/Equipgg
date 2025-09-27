const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkDatabaseStatus() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔍 Checking Supabase Database Status...\n');

  const tables = [
    'users', 'achievements', 'user_achievements', 'items', 'user_items',
    'crates', 'user_crates', 'perks', 'user_perk_claims', 'ranks',
    'user_ranks', 'badges', 'user_badges', 'matches', 'user_bets',
    'missions', 'user_mission_progress', 'forum_categories', 'forum_topics',
    'forum_posts', 'chat_messages', 'notifications', 'user_transactions',
    'user_stats', 'site_settings'
  ];

  console.log('📊 TABLE STATUS:\n');

  for (const table of tables) {
    try {
      // Check if table exists and get count
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        if (countError.message.includes('does not exist')) {
          console.log('❌', table.padEnd(20), ': Table does not exist');
        } else {
          console.log('⚠️ ', table.padEnd(20), ':', countError.message);
        }
      } else {
        console.log('✅', table.padEnd(20), ':', count, 'records');
      }
    } catch (err) {
      console.log('❌', table.padEnd(20), ': Table does not exist');
    }
  }

  console.log('\n🔍 DETAILED DATA CHECK:\n');

  // Check some key tables with sample data
  const keyTables = ['achievements', 'items', 'crates', 'perks', 'ranks', 'badges'];

  for (const table of keyTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(3);

      if (!error && data) {
        console.log(`📋 ${table.toUpperCase()}:`);
        data.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.name || item.title || 'Unnamed'} (${item.id})`);
        });
        console.log('');
      }
    } catch (err) {
      // Skip if table doesn't exist
    }
  }
}

checkDatabaseStatus().catch(console.error);