// Script to populate achievements table with sample data
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sampleAchievements = [
  // Betting achievements
  {
    name: "First Bet",
    description: "Place your first bet on any match",
    category: "Betting",
    xp_reward: 50,
    coin_reward: 100,
    gem_reward: 0,
    icon_url: "/icons/achievements/first-bet.png",
    is_active: true
  },
  {
    name: "Lucky Streak",
    description: "Win 5 bets in a row",
    category: "Betting",
    xp_reward: 200,
    coin_reward: 500,
    gem_reward: 1,
    icon_url: "/icons/achievements/lucky-streak.png",
    is_active: true
  },
  {
    name: "High Roller",
    description: "Place a bet worth 1000+ coins",
    category: "Betting",
    xp_reward: 150,
    coin_reward: 250,
    gem_reward: 0,
    icon_url: "/icons/achievements/high-roller.png",
    is_active: true
  },
  
  // Gaming achievements
  {
    name: "First Win",
    description: "Win your first game",
    category: "Gaming",
    xp_reward: 100,
    coin_reward: 200,
    gem_reward: 0,
    icon_url: "/icons/achievements/first-win.png",
    is_active: true
  },
  {
    name: "Game Master",
    description: "Play 100 games",
    category: "Gaming",
    xp_reward: 500,
    coin_reward: 1000,
    gem_reward: 2,
    icon_url: "/icons/achievements/game-master.png",
    is_active: true
  },
  {
    name: "Lucky Number",
    description: "Win with a 7x multiplier",
    category: "Gaming",
    xp_reward: 300,
    coin_reward: 777,
    gem_reward: 1,
    icon_url: "/icons/achievements/lucky-seven.png",
    is_active: true
  },
  
  // Social achievements
  {
    name: "Welcome",
    description: "Complete your profile setup",
    category: "Social",
    xp_reward: 25,
    coin_reward: 50,
    gem_reward: 0,
    icon_url: "/icons/achievements/welcome.png",
    is_active: true
  },
  {
    name: "Chatty",
    description: "Send 100 chat messages",
    category: "Social",
    xp_reward: 150,
    coin_reward: 300,
    gem_reward: 0,
    icon_url: "/icons/achievements/chatty.png",
    is_active: true
  },
  {
    name: "Mentor",
    description: "Refer 5 friends to EquipGG",
    category: "Social",
    xp_reward: 400,
    coin_reward: 1000,
    gem_reward: 3,
    icon_url: "/icons/achievements/mentor.png",
    is_active: true
  },
  
  // Collection achievements
  {
    name: "Collector",
    description: "Own 10 different items",
    category: "Collection",
    xp_reward: 200,
    coin_reward: 400,
    gem_reward: 1,
    icon_url: "/icons/achievements/collector.png",
    is_active: true
  },
  {
    name: "Rare Hunter",
    description: "Own 3 rare or higher items",
    category: "Collection",
    xp_reward: 300,
    coin_reward: 600,
    gem_reward: 2,
    icon_url: "/icons/achievements/rare-hunter.png",
    is_active: true
  },
  {
    name: "Legendary Owner",
    description: "Own a legendary item",
    category: "Collection",
    xp_reward: 500,
    coin_reward: 1500,
    gem_reward: 5,
    icon_url: "/icons/achievements/legendary.png",
    is_active: true
  },
  
  // Daily achievements
  {
    name: "Daily Player",
    description: "Log in 7 days in a row",
    category: "Daily",
    xp_reward: 250,
    coin_reward: 500,
    gem_reward: 1,
    icon_url: "/icons/achievements/daily-player.png",
    is_active: true
  },
  {
    name: "Dedicated",
    description: "Log in 30 days in a row",
    category: "Daily",
    xp_reward: 750,
    coin_reward: 2000,
    gem_reward: 5,
    icon_url: "/icons/achievements/dedicated.png",
    is_active: true
  },
  
  // Special achievements
  {
    name: "Early Adopter",
    description: "Joined EquipGG in the first month",
    category: "Special",
    xp_reward: 1000,
    coin_reward: 5000,
    gem_reward: 10,
    icon_url: "/icons/achievements/early-adopter.png",
    is_active: true
  },
  {
    name: "Beta Tester",
    description: "Participated in the beta testing",
    category: "Special",
    xp_reward: 500,
    coin_reward: 2500,
    gem_reward: 7,
    icon_url: "/icons/achievements/beta-tester.png",
    is_active: true
  }
];

async function populateAchievements() {
  try {
    console.log('🏆 Populating achievements table with sample data...');
    
    const { data, error } = await supabase
      .from('achievements')
      .insert(sampleAchievements)
      .select();
    
    if (error) {
      console.error('❌ Error inserting achievements:', error);
      process.exit(1);
    }
    
    console.log('✅ Successfully inserted', data.length, 'achievements');
    console.log('Categories created:');
    const categories = [...new Set(data.map(a => a.category))];
    categories.forEach(cat => {
      const count = data.filter(a => a.category === cat).length;
      console.log(`  - ${cat}: ${count} achievements`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

populateAchievements();