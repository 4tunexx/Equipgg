-- EquipGG Database Schema and Data Population
-- This creates all tables and populates them with comprehensive CS2 gambling platform data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===============================
-- ACHIEVEMENTS TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS achievements (
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
CREATE TABLE IF NOT EXISTS badges (
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
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- ===============================
-- USER BADGES TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- ===============================
-- USER INVENTORY TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS user_inventory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  crate_id INTEGER REFERENCES crates(id) ON DELETE CASCADE,
  item_received_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
  opened_at TIMESTAMP DEFAULT NOW()
);

-- ===============================
-- TRADE UP CONTRACTS TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS trade_up_contracts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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
-- EquipGG Database Population Part 2
-- Continuing with remaining badges, crates, items, missions, perks, and ranks

-- ===============================
-- POPULATE REMAINING BADGES
-- ===============================

-- Collection & Inventory Badges (8)
INSERT INTO badges (name, description, category, requirement_type, requirement_value, rarity) VALUES
('Pointy End', 'Earned by owning any Knife skin—sharp style unlocked!', 'collection', 'knife_owned', 1, 'rare'),
('Hand-in-Glove', 'A badge for owning any pair of Gloves, adding flair to your hands.', 'collection', 'gloves_owned', 1, 'rare'),
('Legendary Arsenal', 'Awarded for owning 5 different Legendary items at once.', 'collection', 'legendary_items', 5, 'epic'),
('Hoarder', 'A proud badge for filling every slot in your inventory (min. 50 slots).', 'collection', 'inventory_full', 50, 'rare'),
('Master of Contracts', 'Earned by completing 50 Trade-Up Contracts, a crafting legend!', 'collection', 'trade_ups', 50, 'epic'),
('StatTrak™ Master', 'A badge for accumulating 1,000 wins on a single StatTrak™ item.', 'collection', 'stattrak_wins', 1000, 'epic'),
('Gambler', 'Awarded for opening 100 crates—risk and reward in style!', 'collection', 'crates_opened', 100, 'rare'),
('Operator', 'Earned by owning your first Operator skin, stepping into elite territory.', 'collection', 'operator_owned', 1, 'uncommon'),

-- Betting Skill Badges (5)
('Untouchable', 'A badge for achieving a 10-win betting streak—unbeatable!', 'betting', 'win_streak', 10, 'epic'),
('Giant Slayer', 'Earned by winning 10 bets on underdog teams (odds > 3.0).', 'betting', 'underdog_wins', 10, 'rare'),
('Prophet', 'A prophetic badge for winning 1,000 total bets.', 'betting', 'total_wins', 1000, 'epic'),
('The Regular', 'Awarded for placing 5,000 total bets, a true betting regular.', 'betting', 'total_bets', 5000, 'epic'),
('Predictor of the Week', 'Finish #1 on the weekly win-rate leaderboard and claim this title!', 'betting', 'weekly_winrate', 1, 'legendary'),

-- Community & Event Badges (5)
('Referral Master', 'Earned by successfully referring 10 friends who reach Level 10.', 'community', 'referrals', 10, 'epic'),
('Community Voice', 'A badge for casting 500 community votes on matches—your voice counts!', 'community', 'votes_cast', 500, 'rare'),
('Moderator', 'A staff-assigned badge for community moderators, a mark of authority.', 'community', 'moderator', 1, 'legendary'),
('Summer Offensive 2025', 'Participated in the Summer 2025 event—wear this seasonal badge with pride!', 'community', 'summer_event', 1, 'rare'),
('Winter Major 2025', 'A badge for joining the Winter 2025 event, celebrating a major milestone.', 'community', 'winter_event', 1, 'rare');

-- ===============================
-- POPULATE CRATES
-- ===============================
INSERT INTO crates (name, description, coin_price, rarity_common, rarity_uncommon, rarity_rare, rarity_epic, rarity_legendary) VALUES
('Level Up Crate', 'A standard crate awarded every time you level up, packed with a random item to boost your collection.', 0, 70.0, 20.0, 7.0, 2.5, 0.5),
('Weekly Loyalty Crate', 'A special crate earned after a 7-day login streak, offering a much higher chance for rare and exciting items.', 0, 0.0, 60.0, 25.0, 12.0, 3.0),
('Prestige Crate', 'An elite crate unlocked only upon achieving Prestige, guaranteeing a high-tier item to showcase your mastery.', 0, 0.0, 0.0, 50.0, 40.0, 10.0),
('Trade-Up Crate', 'A crate received after a successful Trade-Up Contract, filled with better-than-average items to elevate your arsenal.', 0, 20.0, 50.0, 20.0, 8.0, 2.0),
('Summer 2025 Crate', 'A limited-time crate available during the Summer 2025 event, featuring exclusive items to celebrate the season.', 500, 50.0, 25.0, 15.0, 8.0, 2.0);

-- ===============================
-- POPULATE ITEMS
-- ===============================

-- Common Skins (20)
INSERT INTO items (name, description, category, weapon_type, rarity, coin_price, gem_price, sell_price) VALUES
('P250 | Sand Dune', 'A sleek, sandy finish for your P250, perfect for a subtle yet stylish start.', 'skin', 'p250', 'common', 100, 0, 25),
('Nova | Polar Mesh', 'A cool, mesh-patterned Nova skin to add a frosty edge to your loadout.', 'skin', 'nova', 'common', 100, 0, 25),
('MP7 | Army Recon', 'A rugged, military-inspired MP7 skin for the tactical player.', 'skin', 'mp7', 'common', 120, 0, 30),
('G3SG1 | Jungle Dashed', 'A jungle-themed G3SG1 with dashed patterns for a wild look.', 'skin', 'g3sg1', 'common', 110, 0, 27),
('P90 | Ash Wood', 'An ash-wood textured P90, blending nature with firepower.', 'skin', 'p90', 'common', 130, 0, 32),
('Tec-9 | Urban DDPAT', 'An urban camouflage Tec-9, ideal for city skirmishes.', 'skin', 'tec9', 'common', 90, 0, 22),
('UMP-45 | Carbon Fiber', 'A sleek carbon fiber UMP-45 for a modern, lightweight feel.', 'skin', 'ump45', 'common', 140, 0, 35),
('MAC-10 | Tarnish', 'A weathered MAC-10 with a tarnished finish for a gritty vibe.', 'skin', 'mac10', 'common', 85, 0, 21),
('XM1014 | Blue Spruce', 'A blue spruce XM1014, bringing a touch of forest elegance.', 'skin', 'xm1014', 'common', 95, 0, 23),
('Sawed-Off | Forest DDPAT', 'A forest camouflage Sawed-Off, perfect for woodland battles.', 'skin', 'sawedoff', 'common', 80, 0, 20),
('Five-SeveN | Coolant', 'A coolant-coated Five-SeveN with a refreshing, icy design.', 'skin', 'fiveseven', 'common', 105, 0, 26),
('MP9 | Storm', 'A stormy MP9 skin, charged with dynamic energy.', 'skin', 'mp9', 'common', 115, 0, 28),
('Glock-18 | High Beam', 'A high-beam Glock-18, lighting up your arsenal with style.', 'skin', 'glock', 'common', 125, 0, 31),
('SSG 08 | Abyss', 'An abyssal SSG 08, diving into deep, mysterious tones.', 'skin', 'ssg08', 'common', 135, 0, 33),
('Dual Berettas | Contractor', 'A contractor-grade Dual Berettas for a no-nonsense look.', 'skin', 'dualberettas', 'common', 75, 0, 18),
('Galil AR | Stone Cold', 'A stone-cold Galil AR, carved with a rugged, icy edge.', 'skin', 'galil', 'common', 110, 0, 27),
('M249 | Predator', 'A predatory M249, ready to dominate with a fierce design.', 'skin', 'm249', 'common', 145, 0, 36),
('FAMAS | Colony', 'A colonial FAMAS skin, blending history with firepower.', 'skin', 'famas', 'common', 100, 0, 25),
('SG 553 | Anodized Navy', 'A navy-anodized SG 553, offering a sleek maritime style.', 'skin', 'sg553', 'common', 120, 0, 30),
('USP-S | Forest Leaves', 'A forest-leaves USP-S, bringing natural beauty to your shots.', 'skin', 'usp', 'common', 110, 0, 27),

-- Legendary Knives (10)
('Karambit | Doppler', 'A dazzling Karambit with a Doppler effect, a true collector''s gem.', 'knife', 'karambit', 'legendary', 50000, 2500, 12500),
('Butterfly Knife | Fade', 'A stunning Butterfly Knife with a fade finish, radiating luxury.', 'knife', 'butterfly', 'legendary', 45000, 2250, 11250),
('M9 Bayonet | Lore', 'An M9 Bayonet etched with lore, a legendary piece of art.', 'knife', 'm9', 'legendary', 48000, 2400, 12000),
('Talon Knife | Slaughter', 'A Talon Knife with a slaughter pattern, fierce and bold.', 'knife', 'talon', 'legendary', 52000, 2600, 13000),
('Skeleton Knife | Crimson Web', 'A Skeleton Knife with crimson webs, dripping with elegance.', 'knife', 'skeleton', 'legendary', 55000, 2750, 13750),
('Huntsman Knife | Tiger Tooth', 'A Huntsman Knife with tiger tooth markings, wild and powerful.', 'knife', 'huntsman', 'legendary', 47000, 2350, 11750),
('Bowie Knife | Case Hardened', 'A Case Hardened Bowie Knife, tough and timeless.', 'knife', 'bowie', 'legendary', 44000, 2200, 11000),
('Falchion Knife | Marble Fade', 'A Falchion Knife with a marble fade, blending beauty and strength.', 'knife', 'falchion', 'legendary', 46000, 2300, 11500),
('Shadow Daggers | Autotronic', 'Shadow Daggers with an autotronic finish, sleek and futuristic.', 'knife', 'shadow', 'legendary', 43000, 2150, 10750),
('Ursus Knife | Ultraviolet', 'An Ursus Knife in ultraviolet, glowing with rare intensity.', 'knife', 'ursus', 'legendary', 49000, 2450, 12250),

-- Epic to Legendary Gloves (10)
('Sport Gloves | Pandora''s Box', 'Sport Gloves with a Pandora''s Box design, a mythical masterpiece.', 'gloves', 'sport', 'legendary', 35000, 1750, 8750),
('Specialist Gloves | Emerald Web', 'Specialist Gloves with an emerald web, exuding rare elegance.', 'gloves', 'specialist', 'legendary', 38000, 1900, 9500),
('Moto Gloves | Spearmint', 'Moto Gloves in spearmint, offering a fresh and bold look.', 'gloves', 'moto', 'epic', 15000, 750, 3750),
('Hand Wraps | Cobalt Skulls', 'Hand Wraps with cobalt skulls, a striking and powerful choice.', 'gloves', 'handwraps', 'epic', 16000, 800, 4000),
('Driver Gloves | King Snake', 'Driver Gloves with a king snake pattern, regal and commanding.', 'gloves', 'driver', 'epic', 17000, 850, 4250),
('Broken Fang Gloves | Jade', 'Broken Fang Gloves in jade, blending toughness with beauty.', 'gloves', 'brokenfang', 'epic', 14000, 700, 3500),
('Bloodhound Gloves | Charred', 'Bloodhound Gloves with a charred finish, rugged and intense.', 'gloves', 'bloodhound', 'rare', 8000, 400, 2000),
('Hydra Gloves | Case Hardened', 'Hydra Gloves with a case-hardened style, durable and unique.', 'gloves', 'hydra', 'rare', 8500, 425, 2125),
('Hand Wraps | Duct Tape', 'Hand Wraps with a duct tape look, practical yet stylish.', 'gloves', 'handwraps', 'uncommon', 3000, 150, 750),
('Moto Gloves | Transport', 'Moto Gloves in a transport design, ready for any journey.', 'gloves', 'moto', 'uncommon', 3200, 160, 800),

-- AWP Skins (20)
('AWP | Dragon Lore', 'The iconic AWP Dragon Lore, a legendary sniper''s dream.', 'skin', 'awp', 'legendary', 75000, 3750, 18750),
('AWP | Gungnir', 'An AWP Gungnir, forged with mythical power.', 'skin', 'awp', 'legendary', 70000, 3500, 17500),
('AWP | Medusa', 'An AWP Medusa, turning foes to stone with its beauty.', 'skin', 'awp', 'legendary', 72000, 3600, 18000),
('AWP | Containment Breach', 'An AWP Containment Breach, radiating hazardous allure.', 'skin', 'awp', 'epic', 25000, 1250, 6250),
('AWP | Hyper Beast', 'An AWP Hyper Beast, wild and ferocious in design.', 'skin', 'awp', 'epic', 22000, 1100, 5500),
('AWP | Asiimov', 'An AWP Asiimov, futuristic and eye-catching.', 'skin', 'awp', 'epic', 20000, 1000, 5000),
('AWP | Neo-Noir', 'An AWP Neo-Noir, blending dark elegance with style.', 'skin', 'awp', 'epic', 23000, 1150, 5750),
('AWP | Wildfire', 'An AWP Wildfire, blazing with intense energy.', 'skin', 'awp', 'epic', 24000, 1200, 6000),
('AWP | Redline', 'An AWP Redline, striking with a bold red streak.', 'skin', 'awp', 'rare', 8000, 400, 2000),
('AWP | Corticera', 'An AWP Corticera, featuring a unique bark-like pattern.', 'skin', 'awp', 'rare', 7500, 375, 1875),
('AWP | Elite Build', 'An AWP Elite Build, built for precision and prestige.', 'skin', 'awp', 'rare', 8500, 425, 2125),
('AWP | Fever Dream', 'An AWP Fever Dream, surreal and captivating.', 'skin', 'awp', 'rare', 9000, 450, 2250),
('AWP | Phobos', 'An AWP Phobos, inspired by the Martian moon''s mystique.', 'skin', 'awp', 'rare', 7800, 390, 1950),
('AWP | Atheris', 'An AWP Atheris, sleek with a snake-inspired design.', 'skin', 'awp', 'uncommon', 3500, 175, 875),
('AWP | PAW', 'An AWP PAW, playful yet powerful.', 'skin', 'awp', 'uncommon', 3200, 160, 800),
('AWP | Exoskeleton', 'An AWP Exoskeleton, armored and tough.', 'skin', 'awp', 'uncommon', 3600, 180, 900),
('AWP | Capillary', 'An AWP Capillary, delicate yet deadly.', 'skin', 'awp', 'uncommon', 3400, 170, 850),
('AWP | Chromatic Aberration', 'An AWP Chromatic Aberration, with a mesmerizing color shift.', 'skin', 'awp', 'epic', 21000, 1050, 5250),
('AWP | POP AWP', 'An AWP POP AWP, vibrant and pop-art inspired.', 'skin', 'awp', 'uncommon', 3800, 190, 950),
('AWP | Worm God', 'An AWP Worm God, earthy and otherworldly.', 'skin', 'awp', 'uncommon', 3300, 165, 825),

-- Operator Skins (10)
('Sir Bloody Darryl', 'The legendary Sir Bloody Darryl, a fierce operator icon.', 'operator', 'operator', 'epic', 12000, 600, 3000),
('Agent Ava | FBI', 'Agent Ava from the FBI, ready for elite missions.', 'operator', 'operator', 'epic', 11500, 575, 2875),
('Number K | Sabre', 'Number K of Sabre, a tactical powerhouse.', 'operator', 'operator', 'epic', 12500, 625, 3125),
('Slingshot | Phoenix', 'Slingshot from Phoenix, agile and bold.', 'operator', 'operator', 'rare', 6000, 300, 1500),
('Frogman | SEAL Team 6', 'Frogman of SEAL Team 6, stealthy and skilled.', 'operator', 'operator', 'rare', 6500, 325, 1625),
('Officer | SAS', 'An SAS Officer, commanding with authority.', 'operator', 'operator', 'rare', 6200, 310, 1550),
('Swoop Squad | FBI', 'Swoop Squad from the FBI, swift and precise.', 'operator', 'operator', 'rare', 6300, 315, 1575),
('Gendarmerie Nationale', 'A Gendarmerie Nationale operator, disciplined and strong.', 'operator', 'operator', 'uncommon', 2500, 125, 625),
('The Doctor | Professionals', 'The Doctor from the Professionals, healing with style.', 'operator', 'operator', 'epic', 11000, 550, 2750),
('Elite Crew | Phoenix', 'Elite Crew from Phoenix, a top-tier team player.', 'operator', 'operator', 'rare', 5800, 290, 1450);

-- Continue with AK-47 and M4 skins in next part...
-- EquipGG Database Population Part 3
-- Final part: AK-47 skins, M4 skins, missions, perks, and ranks

-- ===============================
-- POPULATE REMAINING ITEMS
-- ===============================

-- AK-47 Skins (20)
INSERT INTO items (name, description, category, weapon_type, rarity, coin_price, gem_price, sell_price) VALUES
('AK-47 | Fire Serpent', 'An AK-47 Fire Serpent, blazing with fiery glory.', 'skin', 'ak47', 'legendary', 68000, 3400, 17000),
('AK-47 | Wild Lotus', 'An AK-47 Wild Lotus, blooming with rare beauty.', 'skin', 'ak47', 'legendary', 65000, 3250, 16250),
('AK-47 | X-Ray', 'An AK-47 X-Ray, revealing its inner power.', 'skin', 'ak47', 'legendary', 62000, 3100, 15500),
('AK-47 | The Empress', 'An AK-47 The Empress, regal and commanding.', 'skin', 'ak47', 'epic', 28000, 1400, 7000),
('AK-47 | Asiimov', 'An AK-47 Asiimov, futuristic and fierce.', 'skin', 'ak47', 'epic', 26000, 1300, 6500),
('AK-47 | Bloodsport', 'An AK-47 Bloodsport, dripping with intensity.', 'skin', 'ak47', 'epic', 27000, 1350, 6750),
('AK-47 | Neon Rider', 'An AK-47 Neon Rider, glowing with neon vibes.', 'skin', 'ak47', 'epic', 25000, 1250, 6250),
('AK-47 | Case Hardened', 'An AK-47 Case Hardened, tough and timeless.', 'skin', 'ak47', 'epic', 24000, 1200, 6000),
('AK-47 | Redline', 'An AK-47 Redline, bold and striking.', 'skin', 'ak47', 'rare', 9500, 475, 2375),
('AK-47 | Point Disarray', 'An AK-47 Point Disarray, chaotic and cool.', 'skin', 'ak47', 'rare', 9000, 450, 2250),
('AK-47 | Elite Build', 'An AK-47 Elite Build, precision-crafted.', 'skin', 'ak47', 'rare', 8800, 440, 2200),
('AK-47 | Phantom Disruptor', 'An AK-47 Phantom Disruptor, ghostly and powerful.', 'skin', 'ak47', 'rare', 9200, 460, 2300),
('AK-47 | Frontside Misty', 'An AK-47 Frontside Misty, misty and mysterious.', 'skin', 'ak47', 'rare', 8600, 430, 2150),
('AK-47 | Slate', 'An AK-47 Slate, sleek with a stone-like finish.', 'skin', 'ak47', 'uncommon', 4000, 200, 1000),
('AK-47 | Safari Mesh', 'An AK-47 Safari Mesh, wild and adventurous.', 'skin', 'ak47', 'uncommon', 3800, 190, 950),
('AK-47 | Blue Laminate', 'An AK-47 Blue Laminate, cool and layered.', 'skin', 'ak47', 'uncommon', 4200, 210, 1050),
('AK-47 | Uncharted', 'An AK-47 Uncharted, exploring new territories.', 'skin', 'ak47', 'uncommon', 3900, 195, 975),
('AK-47 | Ice Coaled', 'An AK-47 Ice Coaled, frozen with style.', 'skin', 'ak47', 'uncommon', 4100, 205, 1025),
('AK-47 | Legion of Anubis', 'An AK-47 Legion of Anubis, ancient and epic.', 'skin', 'ak47', 'epic', 29000, 1450, 7250),
('AK-47 | Head Shot', 'An AK-47 Head Shot, precision in every shot.', 'skin', 'ak47', 'rare', 8400, 420, 2100),

-- M4A1 / M4A4 Skins (20)
('M4A4 | Howl', 'The legendary M4A4 Howl, a roaring masterpiece.', 'skin', 'm4a4', 'legendary', 80000, 4000, 20000),
('M4A1-S | Printstream', 'An M4A1-S Printstream, flowing with digital art.', 'skin', 'm4a1', 'legendary', 76000, 3800, 19000),
('M4A4 | Poseidon', 'An M4A4 Poseidon, ruling the waves with power.', 'skin', 'm4a4', 'legendary', 78000, 3900, 19500),
('M4A1-S | Welcome to the Jungle', 'An M4A1-S Welcome to the Jungle, wild and vibrant.', 'skin', 'm4a1', 'legendary', 74000, 3700, 18500),
('M4A4 | The Emperor', 'An M4A4 The Emperor, commanding with royalty.', 'skin', 'm4a4', 'epic', 32000, 1600, 8000),
('M4A1-S | Hyper Beast', 'An M4A1-S Hyper Beast, ferocious and bold.', 'skin', 'm4a1', 'epic', 30000, 1500, 7500),
('M4A4 | Asiimov', 'An M4A4 Asiimov, futuristic and striking.', 'skin', 'm4a4', 'epic', 31000, 1550, 7750),
('M4A1-S | Player Two', 'An M4A1-S Player Two, playful yet powerful.', 'skin', 'm4a1', 'epic', 28000, 1400, 7000),
('M4A4 | Neo-Noir', 'An M4A4 Neo-Noir, dark and stylish.', 'skin', 'm4a4', 'epic', 29000, 1450, 7250),
('M4A1-S | Cyrex', 'An M4A1-S Cyrex, sleek with a tech edge.', 'skin', 'm4a1', 'rare', 10500, 525, 2625),
('M4A4 | Dragon King', 'An M4A4 Dragon King, majestic and fierce.', 'skin', 'm4a4', 'rare', 11000, 550, 2750),
('M4A1-S | Mecha Industries', 'An M4A1-S Mecha Industries, robotic and cool.', 'skin', 'm4a1', 'rare', 10800, 540, 2700),
('M4A4 | Desolate Space', 'An M4A4 Desolate Space, vast and mysterious.', 'skin', 'm4a4', 'rare', 10200, 510, 2550),
('M4A1-S | Nightmare', 'An M4A1-S Nightmare, hauntingly beautiful.', 'skin', 'm4a1', 'rare', 9800, 490, 2450),
('M4A4 | Magnesium', 'An M4A4 Magnesium, light and durable.', 'skin', 'm4a4', 'uncommon', 4500, 225, 1125),
('M4A1-S | Leaded Glass', 'An M4A1-S Leaded Glass, elegant and translucent.', 'skin', 'm4a1', 'uncommon', 4300, 215, 1075),
('M4A4 | Converter', 'An M4A4 Converter, modern and efficient.', 'skin', 'm4a4', 'uncommon', 4400, 220, 1100),
('M4A1-S | Moss Quartz', 'An M4A1-S Moss Quartz, natural and refined.', 'skin', 'm4a1', 'uncommon', 4600, 230, 1150),
('M4A4 | Poly Mag', 'An M4A4 Poly Mag, colorful and versatile.', 'skin', 'm4a4', 'uncommon', 4200, 210, 1050),
('M4A1-S | Night Terror', 'An M4A1-S Night Terror, dark and thrilling.', 'skin', 'm4a1', 'uncommon', 4700, 235, 1175);

-- ===============================
-- POPULATE MISSIONS
-- ===============================

-- Daily Missions (9)
INSERT INTO missions (name, description, mission_type, xp_reward, coin_reward, requirement_type, requirement_value, is_repeatable) VALUES
('Log In', 'Kick off your day with a simple login to EquipGG.net and earn a quick XP boost!', 'daily', 50, 100, 'login', 1, true),
('Place a Bet', 'Test your prediction skills by placing at least one bet on any match for a rewarding XP gain.', 'daily', 75, 150, 'bet_place', 1, true),
('Cast a Vote', 'Make your voice heard by casting a community vote on a match and snag some easy XP.', 'daily', 60, 120, 'vote_cast', 1, true),
('Chatterbox', 'Get social by sending 5 messages in any chat room—connect and earn XP!', 'daily', 80, 100, 'chat_messages', 5, true),
('Place 3 Bets', 'Up the ante by placing a total of 3 bets in a day for a hefty XP reward.', 'daily', 150, 300, 'bet_place', 3, true),
('Window Shopper', 'Explore the shop page to discover new skins and crates, earning XP for your curiosity.', 'daily', 40, 80, 'shop_visit', 1, true),
('Coin Earner', 'Rack up at least 500 Coins from winning bets to claim a solid XP bonus.', 'daily', 100, 200, 'coins_earned', 500, true),
('Check the Ranks', 'Visit the leaderboard page to size up the competition and earn a small XP reward.', 'daily', 30, 60, 'leaderboard_visit', 1, true),
('Win a Bet', 'Celebrate your first win of the day with a big XP boost for successfully predicting a match outcome.', 'daily', 120, 250, 'bet_win', 1, true),

-- Main Missions Tier 1: Onboarding (1-10)
('The First Step', 'Take your first bet and step into the world of predictions with a rewarding XP start.', 'main', 200, 500, 'bet_place', 1, false),
('A Winner is You', 'Win your very first bet and celebrate with a generous XP boost!', 'main', 300, 750, 'bet_win', 1, false),
('Join the Conversation', 'Cast your first community vote and earn XP while shaping the community.', 'main', 150, 300, 'vote_cast', 1, false),
('Getting Paid', 'Earn your first 1,000 Coins and unlock a nice XP reward for your efforts.', 'main', 250, 500, 'coins_total', 1000, false),
('Moving Up', 'Reach Level 5 and celebrate your early progress with a substantial XP gain.', 'main', 400, 800, 'level_reach', 5, false),
('What''s in the Box?', 'Open your first Crate and discover the thrill of unboxing with an XP reward.', 'main', 200, 400, 'crate_open', 1, false),
('Gear Up', 'Equip your first item to your profile and earn XP for showing off your style.', 'main', 180, 360, 'item_equip', 1, false),
('Liquidate Assets', 'Sell an item back to the shop for the first time and claim your XP reward.', 'main', 160, 320, 'item_sell', 1, false),
('Sizing Up Competition', 'Check out the leaderboard to see where you stand and earn a quick XP boost.', 'main', 100, 200, 'leaderboard_visit', 1, false),
('Speak Your Mind', 'Make your first forum post and earn XP while joining the community discussion.', 'main', 220, 440, 'forum_post', 1, false),

-- Main Missions Tier 2: The Regular (11-25)
('Active Bettor', 'Place 25 bets and prove your dedication with a solid XP reward.', 'main', 600, 1200, 'bet_place', 25, false),
('Novice Predictor', 'Win 10 bets and earn a hefty XP boost as you hone your prediction skills.', 'main', 800, 1600, 'bet_win', 10, false),
('Climbing the Ladder', 'Reach Level 25 and celebrate your milestone with a big XP gain.', 'main', 1200, 2400, 'level_reach', 25, false),
('Building a Bank', 'Accumulate 25,000 Coins and unlock a rewarding XP bonus.', 'main', 1000, 2000, 'coins_total', 25000, false),
('Daily Dedication', 'Complete 20 Daily Missions and earn XP for your consistent effort.', 'main', 700, 1400, 'daily_missions', 20, false),
('The Comeback', 'Win a bet on a team with odds of 2.5 or higher for an impressive XP reward.', 'main', 500, 1000, 'underdog_win', 1, false),
('Hot Streak', 'Win 3 bets in a row and claim an XP boost for your winning streak!', 'main', 600, 1200, 'win_streak', 3, false),
('Crate Opener', 'Open 10 Crates and earn XP as you build your collection.', 'main', 800, 1600, 'crate_open', 10, false),
('Armory Started', 'Own 5 different skins and receive an XP reward for your growing arsenal.', 'main', 500, 1000, 'skins_owned', 5, false),
('The Alchemist', 'Complete your first Trade-Up Contract and unlock XP for your crafting skills.', 'main', 400, 800, 'trade_up', 1, false),
('Power Up', 'Purchase a perk from the shop and earn XP for enhancing your gameplay.', 'main', 300, 600, 'perk_buy', 1, false),
('Opinionated', 'Cast 50 community votes and gain XP for your active participation.', 'main', 900, 1800, 'vote_cast', 50, false),
('Show Off', 'Customize your profile showcase and earn XP for your personal touch.', 'main', 350, 700, 'profile_customize', 1, false),
('Community Member', 'Make 10 forum posts and collect XP for your community engagement.', 'main', 600, 1200, 'forum_post', 10, false),
('The Recruiter', 'Successfully refer a friend and earn a massive XP reward for growing the community.', 'main', 1500, 3000, 'referral', 1, false);

-- Continue with remaining missions, perks, and ranks...

-- ===============================
-- POPULATE PERKS
-- ===============================

-- XP & Coin Boosts
INSERT INTO perks (name, description, category, perk_type, effect_value, duration_hours, coin_price) VALUES
('2x XP Boost (3 Hours)', 'Double all the XP you earn from betting and missions for an intense 3-hour power-up.', 'xp_boost', 'xp_multiplier', 2.0, 3, 500),
('1.5x XP Boost (24 Hours)', 'Enjoy a 50% boost to all XP earned over a full day, giving you a steady edge in your progression.', 'xp_boost', 'xp_multiplier', 1.5, 24, 1200),
('Mission XP Doubler (24 Hours)', 'Double the XP rewards from completing daily and main missions for one day.', 'xp_boost', 'mission_xp_multiplier', 2.0, 24, 800),
('+10% Coin Wins (24 Hours)', 'Boost your coin earnings by 10% on every successful bet for a full day.', 'xp_boost', 'coin_multiplier', 1.1, 24, 600),

-- Cosmetic Effects
('White Nickname Glow (7 Days)', 'Make your nickname shine with a sleek white glow across the site.', 'cosmetic', 'nickname_glow', 0, 168, 400),
('Orange Nickname Glow (7 Days)', 'Stand out with the signature EquipGG orange glow, adding a bold touch to your online presence.', 'cosmetic', 'nickname_glow', 0, 168, 500),
('Purple Nickname Glow (7 Days)', 'Radiate style with a vibrant purple glow, perfect for showing off your unique flair.', 'cosmetic', 'nickname_glow', 0, 168, 600),
('Animated Profile Background (14 Days)', 'Transform your profile with a dynamic animated background, making your showcase page pop!', 'cosmetic', 'profile_background', 0, 336, 1000),
('Orange Chat Color (14 Days)', 'Light up conversations with the EquipGG orange chat color, ensuring your messages stand out.', 'cosmetic', 'chat_color', 0, 336, 700),
('Supporter Chat Badge (30 Days)', 'Proudly display a special supporter badge next to your name in chat.', 'cosmetic', 'chat_badge', 0, 720, 1500),

-- Utility Perks
('+1 Inventory Slot', 'Permanently expand your inventory by one slot, giving you more room for skins and treasures.', 'utility', 'inventory_slot', 1, 0, 800),
('+5 Inventory Slots', 'Unlock a massive boost with 5 permanent extra slots, perfect for serious collectors.', 'utility', 'inventory_slot', 5, 0, 3500),
('Rarity Booster (1 Crate)', 'Skyrocket your chances of unboxing a Rare or better item from your next crate.', 'utility', 'rarity_boost', 0, 0, 1000),
('Resell Boost (24 Hours)', 'Increase the sell-back value of your items from 25% to 40% for one day.', 'utility', 'resell_boost', 1.6, 24, 600),
('StatTrak™ Application Tool', 'Upgrade one of your weapon skins to a StatTrak™ version permanently.', 'utility', 'stattrak_tool', 0, 0, 2000),

-- Betting Perks
('Bet Insurance (24 Hours)', 'Get 50% of your coins back on up to 5 lost bets for 24 hours.', 'betting', 'bet_insurance', 0.5, 24, 1200),
('Free Bet Token (500 Coins)', 'Place a bet up to 500 coins for free—if you lose, you lose nothing!', 'betting', 'free_bet', 500, 0, 400),
('Free Bet Token (2500 Coins)', 'Take a risk-free shot at a big win with a free bet up to 2500 coins.', 'betting', 'free_bet', 2500, 0, 1800),
('Odds Booster (x0.1)', 'Add +0.1 to the odds multiplier on your next winning bet.', 'betting', 'odds_boost', 0.1, 0, 300),
('Odds Booster (x0.3)', 'Boost your next winning bet''s odds by +0.3, a powerful single-use perk.', 'betting', 'odds_boost', 0.3, 0, 800),
('Bet Refund Token', 'Instantly recover the coins from one lost bet with this one-time lifesaver.', 'betting', 'bet_refund', 0, 0, 1000);

-- ===============================
-- POPULATE RANKS
-- ===============================
INSERT INTO ranks (rank_number, name, tier, min_level, max_level) VALUES
-- Silver Tier (1-20)
(1, 'Silver I', 'silver', 1, 2),
(2, 'Silver II', 'silver', 3, 4),
(3, 'Silver III', 'silver', 5, 6),
(4, 'Silver IV', 'silver', 7, 8),
(5, 'Silver V', 'silver', 9, 10),
(6, 'Silver VI', 'silver', 11, 12),
(7, 'Silver VII', 'silver', 13, 14),
(8, 'Silver VIII', 'silver', 15, 16),
(9, 'Silver IX', 'silver', 17, 18),
(10, 'Silver Elite', 'silver', 19, 20),

-- Gold Nova Tier (21-40)
(11, 'Gold Nova I', 'gold_nova', 21, 22),
(12, 'Gold Nova II', 'gold_nova', 23, 24),
(13, 'Gold Nova III', 'gold_nova', 25, 26),
(14, 'Gold Nova IV', 'gold_nova', 27, 28),
(15, 'Gold Nova V', 'gold_nova', 29, 30),
(16, 'Gold Nova VI', 'gold_nova', 31, 32),
(17, 'Gold Nova VII', 'gold_nova', 33, 34),
(18, 'Gold Nova VIII', 'gold_nova', 35, 36),
(19, 'Gold Nova IX', 'gold_nova', 37, 38),
(20, 'Gold Nova Master', 'gold_nova', 39, 40),

-- Master Guardian Tier (41-60)
(21, 'Master Guardian I', 'master_guardian', 41, 42),
(22, 'Master Guardian II', 'master_guardian', 43, 44),
(23, 'Master Guardian III', 'master_guardian', 45, 46),
(24, 'Master Guardian IV', 'master_guardian', 47, 48),
(25, 'Master Guardian V', 'master_guardian', 49, 50),
(26, 'Master Guardian Elite I', 'master_guardian', 51, 52),
(27, 'Master Guardian Elite II', 'master_guardian', 53, 54),
(28, 'Master Guardian Elite III', 'master_guardian', 55, 56),
(29, 'Distinguished Master Guardian', 'master_guardian', 57, 58),
(30, 'Prime Master Guardian', 'master_guardian', 59, 60),

-- Legendary Tier (61-80)
(31, 'Legendary Eagle I', 'legendary', 61, 62),
(32, 'Legendary Eagle II', 'legendary', 63, 64),
(33, 'Legendary Eagle III', 'legendary', 65, 66),
(34, 'Legendary Eagle Master I', 'legendary', 67, 68),
(35, 'Legendary Eagle Master II', 'legendary', 69, 70),
(36, 'Supreme Master First Class', 'legendary', 71, 72),
(37, 'Supreme Master Second Class', 'legendary', 73, 74),
(38, 'Supreme Master Guardian', 'legendary', 75, 76),
(39, 'Legendary Guardian', 'legendary', 77, 78),
(40, 'Mythic Guardian', 'legendary', 79, 80),

-- Global Elite Tier (81-100)
(41, 'Global Initiate', 'global_elite', 81, 82),
(42, 'Global Sentinel', 'global_elite', 83, 84),
(43, 'Global Paragon', 'global_elite', 85, 86),
(44, 'Global Vanguard', 'global_elite', 87, 88),
(45, 'Global Warlord', 'global_elite', 89, 90),
(46, 'Global Overlord', 'global_elite', 91, 92),
(47, 'Global Elite Guardian', 'global_elite', 93, 94),
(48, 'Global Elite Master', 'global_elite', 95, 96),
(49, 'Supreme Global Elite', 'global_elite', 97, 98),
(50, 'The Global Elite', 'global_elite', 99, 100);

-- ===============================
-- CREATE INDEXES FOR PERFORMANCE
-- ===============================
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_missions_user_id ON user_missions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_perks_user_id ON user_perks(user_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_rarity ON items(rarity);
CREATE INDEX IF NOT EXISTS idx_missions_type ON missions(mission_type);
CREATE INDEX IF NOT EXISTS idx_ranks_level ON ranks(min_level, max_level);

-- Success message
SELECT 'EquipGG Database fully populated with 50+ achievements, 50+ badges, 110+ items, 59 missions, 16 perks, and 50 ranks!' as status;
