// Complete Supabase schema dump - see EVERYTHING
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function dumpFullSchema() {
  console.log('🔍 COMPLETE SUPABASE SCHEMA DUMP\n');
  console.log('='.repeat(80));

  // Get ALL achievements with full details
  console.log('\n📋 ACHIEVEMENTS (All 66):');
  console.log('='.repeat(80));
  const { data: achievements } = await supabase
    .from('achievements')
    .select('*')
    .order('id');
  
  if (achievements) {
    console.log(`Total: ${achievements.length} achievements\n`);
    achievements.forEach((ach, i) => {
      console.log(`${i + 1}. ${ach.name}`);
      console.log(`   Category: ${ach.category}`);
      console.log(`   Description: ${ach.description}`);
      console.log(`   Requirement: ${ach.requirement_type} >= ${ach.requirement_value}`);
      console.log(`   Rewards: ${ach.xp_reward} XP${ach.coin_reward ? `, ${ach.coin_reward} coins` : ''}${ach.gem_reward ? `, ${ach.gem_reward} gems` : ''}`);
      console.log(`   Rarity: ${ach.rarity || 'N/A'}`);
      console.log('');
    });
  }

  // Get ALL missions with full details
  console.log('\n📋 MISSIONS (All 61):');
  console.log('='.repeat(80));
  const { data: missions } = await supabase
    .from('missions')
    .select('*')
    .order('id');
  
  if (missions) {
    console.log(`Total: ${missions.length} missions\n`);
    missions.forEach((mission, i) => {
      console.log(`${i + 1}. ${mission.name}`);
      console.log(`   Type: ${mission.type || 'N/A'}`);
      console.log(`   Description: ${mission.description}`);
      console.log(`   Requirement: ${mission.requirement_type} >= ${mission.requirement_value}`);
      console.log(`   Rewards: ${mission.xp_reward} XP${mission.coin_reward ? `, ${mission.coin_reward} coins` : ''}${mission.gem_reward ? `, ${mission.gem_reward} gems` : ''}`);
      console.log(`   Repeatable: ${mission.repeatable}`);
      console.log('');
    });
  }

  // Get ALL items
  console.log('\n📋 ITEMS (All 110):');
  console.log('='.repeat(80));
  const { data: items } = await supabase
    .from('items')
    .select('*')
    .order('id');
  
  if (items) {
    console.log(`Total: ${items.length} items\n`);
    const byRarity = {};
    items.forEach(item => {
      const rarity = item.rarity || 'unknown';
      if (!byRarity[rarity]) byRarity[rarity] = [];
      byRarity[rarity].push(item);
    });
    
    Object.keys(byRarity).forEach(rarity => {
      console.log(`\n${rarity.toUpperCase()} (${byRarity[rarity].length}):`);
      byRarity[rarity].forEach(item => {
        console.log(`  - ${item.name} (${item.type}) - Value: ${item.value || 'N/A'}`);
      });
    });
  }

  // Get ALL crates
  console.log('\n\n📋 CRATES (All 5):');
  console.log('='.repeat(80));
  const { data: crates } = await supabase
    .from('crates')
    .select('*')
    .order('id');
  
  if (crates) {
    crates.forEach((crate, i) => {
      console.log(`\n${i + 1}. ${crate.name}`);
      console.log(`   Description: ${crate.description}`);
      console.log(`   Price: ${crate.price || 'N/A'} coins`);
      console.log(`   Key Required: ${crate.requires_key || false}`);
    });
  }

  // Get users table structure
  console.log('\n\n📋 USERS TABLE:');
  console.log('='.repeat(80));
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .limit(5);
  
  if (users && users.length > 0) {
    console.log('Sample user structure:');
    console.log(JSON.stringify(users[0], null, 2));
  }

  // Get chat channels
  console.log('\n\n📋 CHAT CHANNELS:');
  console.log('='.repeat(80));
  const { data: channels } = await supabase
    .from('chat_channels')
    .select('*')
    .order('id');
  
  if (channels) {
    channels.forEach(channel => {
      console.log(`- ${channel.name}: ${channel.description || 'No description'}`);
    });
  }

  // Check for any other tables
  console.log('\n\n📋 CHECKING FOR OTHER TABLES:');
  console.log('='.repeat(80));
  
  const tablesToCheck = [
    'ranks', 'badges', 'perks', 'user_perks', 'prestige', 
    'daily_rewards', 'weekly_rewards', 'shop_items',
    'tournaments', 'teams', 'seasons', 'events'
  ];
  
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`✅ ${table} - EXISTS`);
      }
    } catch (err) {
      // Table doesn't exist
    }
  }

  // Save everything to JSON
  const fs = require('fs');
  fs.writeFileSync('COMPLETE_SUPABASE_DUMP.json', JSON.stringify({
    achievements,
    missions,
    items,
    crates,
    channels,
    users: users?.map(u => ({ id: u.id, username: u.username, level: u.level, xp: u.xp }))
  }, null, 2));
  
  console.log('\n\n✅ Complete dump saved to COMPLETE_SUPABASE_DUMP.json');
}

dumpFullSchema().catch(console.error);
