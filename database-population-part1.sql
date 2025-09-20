-- EquipGG Database Schema and Data Population
-- This creates all tables and populates them with comprehensive CS2 gambling platform data
-- 
-- ⚠️ WARNING: This script will DROP and RECREATE these tables:
--   • achievements table (and all data)
--   • badges table (and all data)
--   • This will also CASCADE to dependent tables (user_achievements, user_badges)
-- If you want to preserve existing data, back it up first!

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===============================
-- ACHIEVEMENTS TABLE
-- ===============================
-- Drop and recreate achievements table to ensure correct schema
DROP TABLE IF EXISTS achievements CASCADE;

CREATE TABLE achievements (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'betting', 'economic', 'progression', 'social'
  xp_reward INTEGER DEFAULT 100,
  icon_url VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ===============================
-- BADGES TABLE
-- ===============================
-- Drop and recreate badges table to ensure correct schema
DROP TABLE IF EXISTS badges CASCADE;

CREATE TABLE badges (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'level', 'wealth', 'collection', 'betting', 'community'
  requirement_type VARCHAR(50), -- 'level', 'coins', 'bets_won', 'items_owned', etc.
  requirement_value INTEGER,
  icon_url VARCHAR(255),
  rarity VARCHAR(20) DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ===============================
-- CRATES TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS crates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  coin_price INTEGER DEFAULT 0,
  gem_price INTEGER DEFAULT 0,
  image_url VARCHAR(255),
  is_purchasable BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  rarity_common DECIMAL(5,2) DEFAULT 0.00,
  rarity_uncommon DECIMAL(5,2) DEFAULT 0.00,
  rarity_rare DECIMAL(5,2) DEFAULT 0.00,
  rarity_epic DECIMAL(5,2) DEFAULT 0.00,
  rarity_legendary DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ===============================
-- ITEMS TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'skin', 'knife', 'gloves', 'operator', 'sticker'
  weapon_type VARCHAR(50), -- 'awp', 'ak47', 'm4a1', 'm4a4', 'karambit', etc.
  rarity VARCHAR(20) NOT NULL, -- 'common', 'uncommon', 'rare', 'epic', 'legendary'
  coin_price INTEGER DEFAULT 0,
  gem_price INTEGER DEFAULT 0,
  image_url VARCHAR(255),
  is_tradeable BOOLEAN DEFAULT true,
  is_sellable BOOLEAN DEFAULT true,
  is_equipable BOOLEAN DEFAULT true,
  sell_price INTEGER DEFAULT 0, -- 25% of purchase price typically
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ===============================
-- MISSIONS TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS missions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  mission_type VARCHAR(20) NOT NULL, -- 'daily', 'main'
  tier INTEGER DEFAULT 1, -- For main missions: 1-4
  order_index INTEGER DEFAULT 0,
  xp_reward INTEGER DEFAULT 50,
  coin_reward INTEGER DEFAULT 0,
  requirement_type VARCHAR(50), -- 'login', 'bet_place', 'bet_win', 'level_reach', etc.
  requirement_value INTEGER DEFAULT 1,
  is_repeatable BOOLEAN DEFAULT false, -- Daily missions are repeatable
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ===============================
-- PERKS TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS perks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'xp_boost', 'cosmetic', 'utility', 'betting'
  perk_type VARCHAR(50) NOT NULL, -- 'xp_multiplier', 'nickname_glow', 'inventory_slot', etc.
  effect_value DECIMAL(10,2), -- Multiplier value, slot count, etc.
  duration_hours INTEGER DEFAULT 0, -- 0 = permanent
  coin_price INTEGER DEFAULT 100,
  gem_price INTEGER DEFAULT 0,
  is_consumable BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ===============================
-- RANKS TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS ranks (
  id SERIAL PRIMARY KEY,
  rank_number INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  tier VARCHAR(50) NOT NULL, -- 'silver', 'gold_nova', 'master_guardian', 'legendary', 'global_elite'
  min_level INTEGER NOT NULL,
  max_level INTEGER NOT NULL,
  icon_url VARCHAR(255),
  prestige_icon_url VARCHAR(255), -- Special icon for prestige players
  created_at TIMESTAMP DEFAULT NOW()
);

-- ===============================
-- USER ACHIEVEMENTS TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- ===============================
-- USER BADGES TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- ===============================
-- USER INVENTORY TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS user_inventory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  is_equipped BOOLEAN DEFAULT false,
  has_stattrak BOOLEAN DEFAULT false,
  stattrak_count INTEGER DEFAULT 0,
  position_index INTEGER DEFAULT 0, -- For drag-and-drop ordering
  acquired_at TIMESTAMP DEFAULT NOW()
);

-- ===============================
-- USER MISSIONS TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS user_missions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  mission_id INTEGER REFERENCES missions(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  last_progress_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, mission_id)
);

-- ===============================
-- USER PERKS TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS user_perks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  perk_id INTEGER REFERENCES perks(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  activated_at TIMESTAMP DEFAULT NOW()
);

-- ===============================
-- CRATE OPENINGS TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS crate_openings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  crate_id INTEGER REFERENCES crates(id) ON DELETE CASCADE,
  item_received_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
  opened_at TIMESTAMP DEFAULT NOW()
);

-- ===============================
-- TRADE UP CONTRACTS TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS trade_up_contracts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  input_items JSONB NOT NULL, -- Array of item IDs used
  output_item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
  contract_cost INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ===============================
-- POPULATE ACHIEVEMENTS
-- ===============================

INSERT INTO achievements (name, description, category, xp_reward) VALUES

-- Betting Achievements (15)
('Getting Started', 'Place your first bet on any match and kick off your betting adventure!', 'betting', 100),
('First Victory', 'Win your first bet and celebrate with a triumphant start.', 'betting', 150),
('Regular Bettor', 'Place a total of 50 bets and earn recognition as a regular player.', 'betting', 500),
('Consistent Winner', 'Win 50 bets total and prove your prediction skills.', 'betting', 750),
('Heating Up', 'Win 3 bets in a row and feel the momentum building!', 'betting', 300),
('Against The Odds', 'Win a bet on a team with odds of 3.0 or higher—defy the odds!', 'betting', 400),
('Seasoned Veteran', 'Place 500 bets total and claim your veteran status.', 'betting', 1000),
('Master Predictor', 'Win 250 bets and showcase your mastery of predictions.', 'betting', 1250),
('High Roller', 'Win a single bet with a payout over 10,000 coins—big wins await!', 'betting', 2000),
('On Fire!', 'Win 7 bets in a row and ignite your winning streak.', 'betting', 800),
('Community Pillar', 'Participate in 10 different community-created bet pools and support the community.', 'betting', 600),
('Legendary Seer', 'Win 1,000 bets total and ascend as a legendary predictor.', 'betting', 2500),
('All In', 'Place a single bet of 50,000 coins or more—go big or go home!', 'betting', 3000),
('Unstoppable', 'Win 15 bets in a row and become truly unstoppable.', 'betting', 1500),
('EquipGG Fixture', 'Place 2,500 bets total and cement your place in EquipGG history.', 'betting', 5000),

-- Economic Achievements (14)
('Pocket Money', 'Accumulate a total of 10,000 coins and start building your fortune.', 'economic', 200),
('First Sale', 'Sell an item back to the shop for your first profitable trade.', 'economic', 150),
('Unboxer', 'Open your first crate and discover the thrill of unboxing.', 'economic', 100),
('Perkaholic', 'Buy any perk from the shop and enhance your gameplay.', 'economic', 200),
('Well Off', 'Accumulate a total of 100,000 coins and enjoy your wealth.', 'economic', 500),
('Contractor', 'Complete your first Trade-Up Contract and unlock crafting rewards.', 'economic', 300),
('Collector', 'Own 5 different "Rare" quality items at the same time—build your collection!', 'economic', 400),
('Crate Connoisseur', 'Open 50 crates and become a crate-opening expert.', 'economic', 1000),
('Master Crafter', 'Complete 10 Trade-Up Contracts and master the art of crafting.', 'economic', 800),
('Jackpot!', 'Unbox a Legendary item from a crate and hit the jackpot!', 'economic', 1500),
('Millionaire', 'Accumulate a total of 1,000,000 coins and join the millionaire''s club.', 'economic', 2000),
('Flipper', 'Sell 50 items back to the shop and perfect your trading skills.', 'economic', 1200),
('The Duo', 'Own a Knife and a pair of Gloves at the same time—style and power combined!', 'economic', 1000),
('Tycoon', 'Accumulate a total of 10,000,000 coins and rise as a tycoon.', 'economic', 5000),

-- Progression Achievements (12)
('Getting Serious', 'Reach Level 10 and show you''re committed to the grind.', 'progression', 300),
('Daily Grind', 'Complete 10 Daily Missions and build your daily routine.', 'progression', 250),
('Quarter Century Club', 'Reach Level 25 and join the elite quarter-century club!', 'progression', 600),
('Mission Accomplished', 'Complete 5 Main Missions and start your epic campaign.', 'progression', 400),
('Halfway There', 'Reach Level 50 and celebrate being halfway to the top!', 'progression', 1000),
('Loyalist', 'Log in 7 days in a row and prove your loyalty.', 'progression', 350),
('Elite', 'Reach Level 75 and claim your elite status.', 'progression', 1500),
('The Pinnacle', 'Reach Level 100 and stand at the peak of progression.', 'progression', 2500),
('Habitual', 'Log in 30 days in a row and make it a habit!', 'progression', 800),
('Completionist', 'Complete all 50 Main Missions and become a true completionist.', 'progression', 3000),
('A New Beginning', 'Achieve Prestige 1 and start a new chapter of greatness.', 'progression', 5000),
('Ascended', 'Achieve Prestige 5 and ascend to the highest ranks!', 'progression', 10000),

-- Social & Community Achievements (9)
('Voice in the Crowd', 'Make your first post on the forums and join the conversation.', 'social', 100),
('Interior Decorator', 'Customize your profile showcase for the first time and add your flair.', 'social', 150),
('Contributor', 'Make 25 posts on the forums and become a valued contributor.', 'social', 400),
('Socialite', 'Successfully refer a friend who reaches Level 10 and grow the community.', 'social', 500),
('Weekly Top 10', 'Finish in the Top 10 on the weekly leaderboard and shine!', 'social', 600),
('Forum Veteran', 'Make 100 posts on the forums and earn veteran status.', 'social', 800),
('Historian', 'Get 100 wins on a single StatTrak™ item and record your legacy.', 'social', 1000),
('Taste Tester', 'Buy at least one of every type of perk from the shop—try them all!', 'social', 1200),
('Fully Decorated', 'Unlock and fill every slot in the Veteran profile showcase—total customization!', 'social', 1500);

-- ===============================
-- POPULATE BADGES  
-- ===============================

INSERT INTO badges (name, description, category, requirement_type, requirement_value, rarity) VALUES

-- Level & Prestige Badges (20)
('Service Medal - Level 1', 'Awarded for reaching Level 1—your first step into the EquipGG.net elite!', 'level', 'level', 1, 'common'),
('Service Medal - Level 10', 'Celebrate hitting Level 10 with this shiny service medal.', 'level', 'level', 10, 'common'),
('Service Medal - Level 25', 'A badge of honor for reaching the impressive Level 25 milestone.', 'level', 'level', 25, 'uncommon'),
('Service Medal - Level 50', 'Mark your journey at Level 50 with this distinguished medal.', 'level', 'level', 50, 'rare'),
('Service Medal - Level 75', 'A prestigious badge for conquering Level 75 with skill.', 'level', 'level', 75, 'epic'),
('Service Medal - Level 100', 'The ultimate service medal for mastering Level 100!', 'level', 'level', 100, 'legendary'),
('Prestige I', 'A coveted badge for achieving the first Prestige rank.', 'level', 'prestige', 1, 'legendary'),
('Prestige II', 'Show off your second Prestige achievement with this elite badge.', 'level', 'prestige', 2, 'legendary'),
('Prestige III', 'Earned for reaching Prestige 3, a true mark of excellence.', 'level', 'prestige', 3, 'legendary'),
('Prestige IV', 'A rare badge for attaining Prestige 4, a testament to your dominance.', 'level', 'prestige', 4, 'legendary'),
('Prestige V', 'The pinnacle of prestige—wear this badge with pride at Prestige 5.', 'level', 'prestige', 5, 'legendary'),
('XP Millionaire', 'Awarded for earning a total of 1,000,000 XP, a millionaire of experience!', 'level', 'total_xp', 1000000, 'epic'),
('XP Tycoon', 'A badge for amassing 5,000,000 XP, showcasing your tycoon status.', 'level', 'total_xp', 5000000, 'epic'),
('XP Baron', 'Celebrate 10,000,000 XP with this noble XP Baron badge.', 'level', 'total_xp', 10000000, 'legendary'),
('Founder', 'A special badge for registering during the launch month of EquipGG.net.', 'level', 'founder', 1, 'legendary'),
('Year 1 Veteran', 'Honoring those who joined in the first year of operation.', 'level', 'veteran', 1, 'epic'),
('Daily Devotion', 'Earned by completing 100 Daily Missions—dedication pays off!', 'level', 'daily_missions', 100, 'rare'),
('Campaigner', 'Awarded for completing 25 Main Missions, a campaign well-fought.', 'level', 'main_missions', 25, 'rare'),
('Grand Campaigner', 'The ultimate badge for conquering all 50 Main Missions.', 'level', 'main_missions', 50, 'epic'),
('Dedicated', 'A badge for achieving an impressive 30-day login streak.', 'level', 'login_streak', 30, 'rare'),

-- Coin & Wealth Badges (12)  
('High Earner', 'Awarded for possessing 100,000 coins at once—start your wealth journey!', 'wealth', 'coins', 100000, 'uncommon'),
('Wealthy', 'A badge for holding 500,000 coins, a sign of prosperity.', 'wealth', 'coins', 500000, 'rare'),
('Coin Millionaire', 'Celebrate owning 1,000,000 coins with this millionaire badge.', 'wealth', 'coins', 1000000, 'epic'),
('Coin Baron', 'A prestigious badge for possessing 10,000,000 coins at once.', 'wealth', 'coins', 10000000, 'legendary'),
('Big Spender', 'Earned by spending a total of 100,000 coins in the shop.', 'wealth', 'coins_spent', 100000, 'uncommon'),
('Shop VIP', 'A VIP badge for spending 1,000,000 coins in the shop.', 'wealth', 'coins_spent', 1000000, 'epic'),
('Major Payout', 'Awarded for winning over 10,000 coins from a single bet.', 'wealth', 'single_bet_win', 10000, 'rare'),
('Jackpot Winner', 'A dazzling badge for winning over 50,000 coins in one bet.', 'wealth', 'single_bet_win', 50000, 'epic'),
('Richest of the Week', 'Finish #1 on the weekly coins leaderboard and claim this title!', 'wealth', 'weekly_top', 1, 'legendary'),
('Sale Hunter', 'Earned by purchasing 5 items during a Flash Sale—bargain master!', 'wealth', 'sale_purchases', 5, 'uncommon'),
('Perk Addict', 'Awarded for buying 25 perks from the shop, a true perk enthusiast.', 'wealth', 'perks_bought', 25, 'rare'),
('Fully Loaded', 'A badge for owning at least one of every type of perk.', 'wealth', 'all_perk_types', 1, 'epic');

-- (Continue with remaining badge inserts...)
-- This is getting quite long, so I'll create the rest in the next part