const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function countEverything() {
  console.log('📊 EXACT COUNTS FOR ALL TABLES\n');
  console.log('='.repeat(80));
  
  const tables = [
    'ranks', 'badges', 'perks', 'achievements', 'missions',
    'items', 'crates', 'users', 'chat_channels',
    'user_achievements', 'user_missions', 'user_badges', 'user_perks',
    'bets', 'inventory', 'leaderboard', 'xp_log',
    'prestige', 'daily_rewards', 'weekly_rewards', 'shop_items',
    'tournaments', 'teams', 'seasons', 'events'
  ];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ERROR - ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count} rows`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
  
  // Now get ALL badges with full details
  console.log('\n' + '='.repeat(80));
  console.log('ALL BADGES (COMPLETE LIST):');
  console.log('='.repeat(80) + '\n');
  
  const { data: allBadges, count: badgeCount } = await supabase
    .from('badges')
    .select('*', { count: 'exact' })
    .order('id');
  
  console.log(`TOTAL: ${badgeCount} badges\n`);
  
  if (allBadges) {
    allBadges.forEach((badge, i) => {
      console.log(`${i + 1}. ${badge.name}`);
      console.log(`   ID: ${badge.id}`);
      console.log(`   Category: ${badge.category}`);
      console.log(`   Description: ${badge.description}`);
      console.log(`   Requirement: ${badge.requirement_type} >= ${badge.requirement_value}`);
      console.log(`   Rarity: ${badge.rarity}`);
      console.log(`   Active: ${badge.is_active}`);
      console.log('');
    });
  }
  
  // Save to file
  const fs = require('fs');
  fs.writeFileSync('ALL_BADGES.json', JSON.stringify(allBadges, null, 2));
  console.log('✅ Saved all badges to ALL_BADGES.json');
}

countEverything();
