#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function directDatabasePopulation() {
  console.log('🚀 Starting direct database population...');

  // Achievements data
  const achievements = [
    {
      name: "First Bet",
      description: "Place your very first bet",
      category: "betting",
      xp_reward: 50,
      coin_reward: 100,
      gem_reward: 0,
      badge_reward: "newcomer",
      is_active: true
    },
    {
      name: "High Roller",
      description: "Bet over 10,000 coins in a single game",
      category: "betting", 
      xp_reward: 500,
      coin_reward: 2000,
      gem_reward: 10,
      badge_reward: "high_roller",
      is_active: true
    },
    {
      name: "Lucky Streak",
      description: "Win 5 bets in a row",
      category: "betting",
      xp_reward: 300,
      coin_reward: 1000,
      gem_reward: 5,
      badge_reward: "lucky",
      is_active: true
    },
    {
      name: "Millionaire",
      description: "Accumulate 1,000,000 coins",
      category: "economic",
      xp_reward: 1000,
      coin_reward: 10000,
      gem_reward: 50,
      badge_reward: "millionaire",
      is_active: true
    },
    {
      name: "Level Up",
      description: "Reach level 10",
      category: "progression",
      xp_reward: 200,
      coin_reward: 500,
      gem_reward: 2,
      badge_reward: "level_10",
      is_active: true
    }
  ];

  // Items data
  const items = [
    {
      name: "AK-47 | Redline",
      description: "A powerful AK-47 with red racing stripes",
      category: "skin",
      weapon_type: "rifle",
      rarity: "epic",
      coin_price: 15000,
      gem_price: 75,
      sell_price: 12000,
      is_active: true
    },
    {
      name: "M4A4 | Asiimov",
      description: "Futuristic M4A4 with white and orange design",
      category: "skin", 
      weapon_type: "rifle",
      rarity: "epic",
      coin_price: 18000,
      gem_price: 90,
      sell_price: 14400,
      is_active: true
    },
    {
      name: "Karambit | Fade",
      description: "Curved knife with beautiful fade pattern",
      category: "knife",
      weapon_type: "melee",
      rarity: "legendary",
      coin_price: 500000,
      gem_price: 2500,
      sell_price: 400000,
      is_active: true
    },
    {
      name: "Sport Gloves | Pandora's Box",
      description: "Luxurious sport gloves with unique pattern",
      category: "gloves",
      weapon_type: "hands",
      rarity: "legendary", 
      coin_price: 300000,
      gem_price: 1500,
      sell_price: 240000,
      is_active: true
    },
    {
      name: "AWP | Dragon Lore",
      description: "Legendary sniper rifle with dragon artwork",
      category: "skin",
      weapon_type: "sniper",
      rarity: "legendary",
      coin_price: 800000,
      gem_price: 4000,
      sell_price: 640000,
      is_active: true
    }
  ];

  // Missions data
  const missions = [
    {
      name: "Daily Login",
      description: "Log in to the platform",
      mission_type: "daily",
      tier: 1,
      xp_reward: 100,
      coin_reward: 500,
      gem_reward: 1,
      requirement_type: "login",
      requirement_value: 1,
      duration_hours: 24,
      is_repeatable: true,
      is_active: true
    },
    {
      name: "Win Streak Master",
      description: "Achieve a 10-game winning streak",
      mission_type: "main",
      tier: 2,
      xp_reward: 1000,
      coin_reward: 5000,
      gem_reward: 25,
      requirement_type: "win_streak",
      requirement_value: 10,
      duration_hours: 0,
      is_repeatable: false,
      is_active: true
    },
    {
      name: "Big Spender",
      description: "Spend 50,000 coins in total",
      mission_type: "main",
      tier: 3,
      xp_reward: 1500,
      coin_reward: 10000,
      gem_reward: 50,
      requirement_type: "total_spent",
      requirement_value: 50000,
      duration_hours: 0,
      is_repeatable: false,
      is_active: true
    }
  ];

  // Perks data
  const perks = [
    {
      name: "XP Boost",
      description: "Double XP gain for 24 hours",
      category: "xp_boost",
      perk_type: "multiplier",
      effect_value: 2.0,
      duration_hours: 24,
      coin_price: 5000,
      gem_price: 25,
      is_active: true
    },
    {
      name: "VIP Chat Color", 
      description: "Golden chat color for 7 days",
      category: "cosmetic",
      perk_type: "visual",
      effect_value: 1.0,
      duration_hours: 168,
      coin_price: 10000,
      gem_price: 50,
      is_active: true
    },
    {
      name: "Betting Boost",
      description: "10% higher betting returns for 12 hours",
      category: "betting",
      perk_type: "multiplier", 
      effect_value: 1.1,
      duration_hours: 12,
      coin_price: 15000,
      gem_price: 75,
      is_active: true
    }
  ];

  try {
    // Insert achievements
    console.log('📝 Inserting achievements...');
    const { data: achievementData, error: achievementError } = await supabase
      .from('achievements')
      .insert(achievements)
      .select();
    
    if (achievementError) {
      console.error('❌ Achievement error:', achievementError);
    } else {
      console.log(`✅ Inserted ${achievementData.length} achievements`);
    }

    // Insert items
    console.log('📝 Inserting items...');
    const { data: itemData, error: itemError } = await supabase
      .from('items')
      .insert(items)
      .select();
    
    if (itemError) {
      console.error('❌ Item error:', itemError);
    } else {
      console.log(`✅ Inserted ${itemData.length} items`);
    }

    // Insert missions
    console.log('📝 Inserting missions...');
    const { data: missionData, error: missionError } = await supabase
      .from('missions')
      .insert(missions)
      .select();
    
    if (missionError) {
      console.error('❌ Mission error:', missionError);
    } else {
      console.log(`✅ Inserted ${missionData.length} missions`);
    }

    // Insert perks
    console.log('📝 Inserting perks...');
    const { data: perkData, error: perkError } = await supabase
      .from('perks')
      .insert(perks)
      .select();
    
    if (perkError) {
      console.error('❌ Perk error:', perkError);
    } else {
      console.log(`✅ Inserted ${perkData.length} perks`);
    }

    console.log('\n🎉 Database population completed successfully!');
    console.log('🔗 Visit /dashboard/admin/game-data to manage the data');

  } catch (error) {
    console.error('❌ Database population failed:', error);
  }
}

directDatabasePopulation().catch(console.error);