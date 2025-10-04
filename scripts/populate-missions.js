// Script to populate default missions in the database
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const defaultMissions = [
  // Daily Betting Missions
  {
    name: 'First Bet of the Day',
    description: 'Place your first bet today',
    mission_type: 'daily',
    tier: 1,
    xp_reward: 50,
    coin_reward: 100,
    gem_reward: 0,
    requirement_type: 'bet_placed',
    requirement_value: 1,
    is_repeatable: true,
    is_active: true,
    order_index: 1
  },
  {
    name: 'Active Bettor',
    description: 'Place 3 bets in a single day',
    mission_type: 'daily',
    tier: 2,
    xp_reward: 100,
    coin_reward: 250,
    gem_reward: 1,
    requirement_type: 'bet_placed',
    requirement_value: 3,
    is_repeatable: true,
    is_active: true,
    order_index: 2
  },
  {
    name: 'High Stakes Player',
    description: 'Place a bet worth 500+ coins',
    mission_type: 'daily',
    tier: 3,
    xp_reward: 150,
    coin_reward: 500,
    gem_reward: 2,
    requirement_type: 'bet_amount',
    requirement_value: 500,
    is_repeatable: true,
    is_active: true,
    order_index: 3
  },

  // Weekly Missions
  {
    name: 'Weekly Bettor',
    description: 'Place 15 bets this week',
    mission_type: 'weekly',
    tier: 1,
    xp_reward: 300,
    coin_reward: 1000,
    gem_reward: 5,
    requirement_type: 'bet_placed',
    requirement_value: 15,
    is_repeatable: true,
    is_active: true,
    order_index: 4
  },
  {
    name: 'Big Spender',
    description: 'Bet a total of 5000 coins this week',
    mission_type: 'weekly',
    tier: 2,
    xp_reward: 500,
    coin_reward: 2000,
    gem_reward: 10,
    requirement_type: 'bet_amount',
    requirement_value: 5000,
    is_repeatable: true,
    is_active: true,
    order_index: 5
  },

  // Achievement-style missions (one-time)
  {
    name: 'First Victory',
    description: 'Win your first bet',
    mission_type: 'main',
    tier: 1,
    xp_reward: 200,
    coin_reward: 500,
    gem_reward: 3,
    requirement_type: 'bet_won',
    requirement_value: 1,
    is_repeatable: false,
    is_active: true,
    order_index: 6
  },
  {
    name: 'Lucky Streak',
    description: 'Win 5 bets in a row',
    mission_type: 'main',
    tier: 3,
    xp_reward: 1000,
    coin_reward: 2500,
    gem_reward: 15,
    requirement_type: 'win_streak',
    requirement_value: 5,
    is_repeatable: false,
    is_active: true,
    order_index: 7
  },
  {
    name: 'High Roller Champion',
    description: 'Win a bet with odds of 5.0 or higher',
    mission_type: 'main',
    tier: 4,
    xp_reward: 1500,
    coin_reward: 5000,
    gem_reward: 25,
    requirement_type: 'high_odds_win',
    requirement_value: 5,
    is_repeatable: false,
    is_active: true,
    order_index: 8
  },

  // General Daily Activities
  {
    name: 'Daily Login',
    description: 'Log in to the platform',
    mission_type: 'daily',
    tier: 1,
    xp_reward: 25,
    coin_reward: 50,
    gem_reward: 0,
    requirement_type: 'login',
    requirement_value: 1,
    is_repeatable: true,
    is_active: true,
    order_index: 9
  }
];

async function populateMissions() {
  try {
    console.log('🚀 Starting missions population...');
    
    // Check if missions already exist
    const { data: existingMissions, error: checkError } = await supabase
      .from('missions')
      .select('id, name')
      .limit(5);
    
    if (checkError) {
      console.error('❌ Error checking existing missions:', checkError);
      return;
    }
    
    if (existingMissions && existingMissions.length > 0) {
      console.log(`📋 Found ${existingMissions.length} existing missions. Skipping population.`);
      console.log('Existing missions:', existingMissions.map(m => m.name));
      return;
    }
    
    // Insert default missions
    const { data: insertedMissions, error: insertError } = await supabase
      .from('missions')
      .insert(defaultMissions)
      .select('id, name, mission_type');
    
    if (insertError) {
      console.error('❌ Error inserting missions:', insertError);
      return;
    }
    
    console.log('✅ Successfully populated missions database!');
    console.log(`📊 Inserted ${insertedMissions.length} missions:`);
    insertedMissions.forEach(mission => {
      console.log(`  - ${mission.name} (${mission.mission_type})`);
    });
    
  } catch (error) {
    console.error('💥 Failed to populate missions:', error);
  }
}

// Execute if running directly
if (require.main === module) {
  populateMissions().then(() => process.exit(0));
}

module.exports = { populateMissions, defaultMissions };