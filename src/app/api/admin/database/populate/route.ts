import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('Starting database population...');

    // Achievements data
    const achievements = [
      { name: "First Bet", description: "Place your very first bet", category: "betting", xp_reward: 50, coin_reward: 100, gem_reward: 0, badge_reward: "newcomer" },
      { name: "High Roller", description: "Bet over 10,000 coins in a single game", category: "betting", xp_reward: 500, coin_reward: 2000, gem_reward: 10, badge_reward: "high_roller" },
      { name: "Lucky Streak", description: "Win 5 bets in a row", category: "betting", xp_reward: 300, coin_reward: 1000, gem_reward: 5, badge_reward: "lucky" },
      { name: "Millionaire", description: "Accumulate 1,000,000 coins", category: "economic", xp_reward: 1000, coin_reward: 10000, gem_reward: 50, badge_reward: "millionaire" },
      { name: "Level Up", description: "Reach level 10", category: "progression", xp_reward: 200, coin_reward: 500, gem_reward: 2, badge_reward: "level_10" },
      { name: "Whale", description: "Bet over 100,000 coins total", category: "betting", xp_reward: 750, coin_reward: 5000, gem_reward: 25, badge_reward: "whale" },
      { name: "Consistent Player", description: "Log in 30 days in a row", category: "progression", xp_reward: 400, coin_reward: 2000, gem_reward: 10, badge_reward: "consistent" },
      { name: "Big Winner", description: "Win over 50,000 coins in a single bet", category: "betting", xp_reward: 600, coin_reward: 3000, gem_reward: 15, badge_reward: "big_winner" },
      { name: "Collector", description: "Own 50 different items", category: "economic", xp_reward: 800, coin_reward: 4000, gem_reward: 20, badge_reward: "collector" },
      { name: "Mission Master", description: "Complete 100 missions", category: "progression", xp_reward: 1200, coin_reward: 8000, gem_reward: 40, badge_reward: "mission_master" }
    ];

    // Items data
    const items = [
      { name: "AK-47 | Redline", description: "A powerful AK-47 with red racing stripes", category: "skin", weapon_type: "rifle", rarity: "epic", coin_price: 15000, gem_price: 75, sell_price: 12000 },
      { name: "M4A4 | Asiimov", description: "Futuristic M4A4 with white and orange design", category: "skin", weapon_type: "rifle", rarity: "epic", coin_price: 18000, gem_price: 90, sell_price: 14400 },
      { name: "AWP | Dragon Lore", description: "Legendary sniper rifle with dragon artwork", category: "skin", weapon_type: "sniper", rarity: "legendary", coin_price: 800000, gem_price: 4000, sell_price: 640000 },
      { name: "Karambit | Fade", description: "Curved knife with beautiful fade pattern", category: "knife", weapon_type: "melee", rarity: "legendary", coin_price: 500000, gem_price: 2500, sell_price: 400000 },
      { name: "Sport Gloves | Pandora's Box", description: "Luxurious sport gloves with unique pattern", category: "gloves", weapon_type: "hands", rarity: "legendary", coin_price: 300000, gem_price: 1500, sell_price: 240000 },
      { name: "M4A1-S | Hot Rod", description: "Sleek M4A1-S with hot rod flames", category: "skin", weapon_type: "rifle", rarity: "rare", coin_price: 8000, gem_price: 40, sell_price: 6400 },
      { name: "Glock-18 | Fade", description: "Colorful fade pattern on reliable sidearm", category: "skin", weapon_type: "pistol", rarity: "rare", coin_price: 5000, gem_price: 25, sell_price: 4000 },
      { name: "Butterfly Knife | Doppler", description: "Butterfly knife with doppler phase pattern", category: "knife", weapon_type: "melee", rarity: "legendary", coin_price: 450000, gem_price: 2250, sell_price: 360000 },
      { name: "Driver Gloves | King Snake", description: "Premium driver gloves with snake skin pattern", category: "gloves", weapon_type: "hands", rarity: "epic", coin_price: 80000, gem_price: 400, sell_price: 64000 },
      { name: "USP-S | Kill Confirmed", description: "Tactical USP-S with military design", category: "skin", weapon_type: "pistol", rarity: "epic", coin_price: 12000, gem_price: 60, sell_price: 9600 }
    ];

    // Missions data
    const missions = [
      { name: "Daily Login", description: "Log in to the platform", mission_type: "daily", tier: 1, xp_reward: 100, coin_reward: 500, gem_reward: 1, requirement_type: "login", requirement_value: 1, duration_hours: 24, is_repeatable: true },
      { name: "Win Streak Master", description: "Achieve a 10-game winning streak", mission_type: "main", tier: 2, xp_reward: 1000, coin_reward: 5000, gem_reward: 25, requirement_type: "win_streak", requirement_value: 10, duration_hours: 0, is_repeatable: false },
      { name: "Big Spender", description: "Spend 50,000 coins in total", mission_type: "main", tier: 3, xp_reward: 1500, coin_reward: 10000, gem_reward: 50, requirement_type: "total_spent", requirement_value: 50000, duration_hours: 0, is_repeatable: false },
      { name: "Daily Trader", description: "Make 3 trades today", mission_type: "daily", tier: 1, xp_reward: 150, coin_reward: 750, gem_reward: 2, requirement_type: "trades", requirement_value: 3, duration_hours: 24, is_repeatable: true },
      { name: "Weekly Warrior", description: "Win 25 games this week", mission_type: "main", tier: 2, xp_reward: 800, coin_reward: 4000, gem_reward: 20, requirement_type: "weekly_wins", requirement_value: 25, duration_hours: 168, is_repeatable: true },
      { name: "Monthly Millionaire", description: "Earn 1,000,000 coins this month", mission_type: "main", tier: 4, xp_reward: 2000, coin_reward: 20000, gem_reward: 100, requirement_type: "monthly_earnings", requirement_value: 1000000, duration_hours: 720, is_repeatable: true }
    ];

    // Perks data
    const perks = [
      { name: "XP Boost", description: "Double XP gain for 24 hours", category: "xp_boost", perk_type: "multiplier", effect_value: 2.0, duration_hours: 24, coin_price: 5000, gem_price: 25 },
      { name: "VIP Chat Color", description: "Golden chat color for 7 days", category: "cosmetic", perk_type: "visual", effect_value: 1.0, duration_hours: 168, coin_price: 10000, gem_price: 50 },
      { name: "Betting Boost", description: "10% higher betting returns for 12 hours", category: "betting", perk_type: "multiplier", effect_value: 1.1, duration_hours: 12, coin_price: 15000, gem_price: 75 },
      { name: "Lucky Charm", description: "5% better crate odds for 48 hours", category: "utility", perk_type: "luck", effect_value: 1.05, duration_hours: 48, coin_price: 8000, gem_price: 40 },
      { name: "Trade Fee Reduction", description: "50% reduced trading fees for 7 days", category: "utility", perk_type: "discount", effect_value: 0.5, duration_hours: 168, coin_price: 12000, gem_price: 60 }
    ];

    // Badges data
    const badges = [
      { name: "Newcomer", description: "Welcome to the platform!", category: "starter", rarity: "common" },
      { name: "High Roller", description: "For the big spenders", category: "betting", rarity: "epic" },
      { name: "Lucky", description: "Fortune favors you", category: "achievement", rarity: "rare" },
      { name: "Millionaire", description: "Wealth beyond measure", category: "economic", rarity: "legendary" },
      { name: "Level 10", description: "Reached level 10", category: "progression", rarity: "uncommon" },
      { name: "Whale", description: "Legendary spender", category: "betting", rarity: "legendary" },
      { name: "Consistent", description: "Regular player", category: "loyalty", rarity: "rare" },
      { name: "Big Winner", description: "Major victory achieved", category: "achievement", rarity: "epic" },
      { name: "Collector", description: "Item collection master", category: "economic", rarity: "epic" },
      { name: "Mission Master", description: "Completed many missions", category: "progression", rarity: "legendary" }
    ];

    let achievementCount = 0;
    let itemCount = 0;
    let missionCount = 0;
    let perkCount = 0;
    let badgeCount = 0;

    // Insert achievements
    for (const achievement of achievements) {
      try {
        const { error } = await supabase
          .from('achievements')
          .insert([{ ...achievement, is_active: true }]);
        if (!error) achievementCount++;
      } catch (err) {
        console.error('Error inserting achievement:', achievement.name, err);
      }
    }

    // Insert items
    for (const item of items) {
      try {
        const { error } = await supabase
          .from('items')
          .insert([{ ...item, is_active: true }]);
        if (!error) itemCount++;
      } catch (err) {
        console.error('Error inserting item:', item.name, err);
      }
    }

    // Insert missions
    for (const mission of missions) {
      try {
        const { error } = await supabase
          .from('missions')
          .insert([{ ...mission, is_active: true }]);
        if (!error) missionCount++;
      } catch (err) {
        console.error('Error inserting mission:', mission.name, err);
      }
    }

    // Insert perks
    for (const perk of perks) {
      try {
        const { error } = await supabase
          .from('perks')
          .insert([{ ...perk, is_active: true }]);
        if (!error) perkCount++;
      } catch (err) {
        console.error('Error inserting perk:', perk.name, err);
      }
    }

    // Insert badges
    for (const badge of badges) {
      try {
        const { error } = await supabase
          .from('badges')
          .insert([{ ...badge, is_active: true }]);
        if (!error) badgeCount++;
      } catch (err) {
        console.error('Error inserting badge:', badge.name, err);
      }
    }

    console.log('Database population completed');
    return NextResponse.json({
      success: true,
      achievements: achievementCount,
      items: itemCount,
      missions: missionCount,
      perks: perkCount,
      badges: badgeCount
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}