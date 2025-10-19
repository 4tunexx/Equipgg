// Script to fetch existing achievements, missions, items, and crates from Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchExistingData() {
  console.log('🔍 Fetching existing data from Supabase...\n');

  // Fetch achievements
  console.log('📋 ACHIEVEMENTS (66):');
  const { data: achievements, error: achError } = await supabase
    .from('achievements')
    .select('*')
    .order('id');
  
  if (achError) {
    console.error('Error:', achError);
  } else {
    console.log(`Found ${achievements.length} achievements`);
    achievements.slice(0, 10).forEach(ach => {
      console.log(`  - ${ach.name} (${ach.category}): ${ach.description}`);
    });
    console.log(`  ... and ${achievements.length - 10} more\n`);
  }

  // Fetch missions
  console.log('📋 MISSIONS (61):');
  const { data: missions, error: missError } = await supabase
    .from('missions')
    .select('*')
    .order('id');
  
  if (missError) {
    console.error('Error:', missError);
  } else {
    console.log(`Found ${missions.length} missions`);
    missions.slice(0, 10).forEach(mission => {
      console.log(`  - ${mission.name} (${mission.type}): ${mission.description}`);
    });
    console.log(`  ... and ${missions.length - 10} more\n`);
  }

  // Fetch items
  console.log('📋 ITEMS (110):');
  const { data: items, error: itemError } = await supabase
    .from('items')
    .select('*')
    .order('id')
    .limit(20);
  
  if (itemError) {
    console.error('Error:', itemError);
  } else {
    console.log(`Found items (showing first 20):`);
    items.forEach(item => {
      console.log(`  - ${item.name} (${item.rarity}): ${item.type}`);
    });
    console.log('  ... and more\n');
  }

  // Fetch crates
  console.log('📋 CRATES (5):');
  const { data: crates, error: crateError } = await supabase
    .from('crates')
    .select('*')
    .order('id');
  
  if (crateError) {
    console.error('Error:', crateError);
  } else {
    console.log(`Found ${crates.length} crates`);
    crates.forEach(crate => {
      console.log(`  - ${crate.name}: ${crate.description}`);
    });
  }

  // Save to JSON for reference
  const fs = require('fs');
  fs.writeFileSync('existing-data.json', JSON.stringify({
    achievements,
    missions,
    items: items,
    crates
  }, null, 2));
  
  console.log('\n✅ Data saved to existing-data.json');
}

fetchExistingData();
