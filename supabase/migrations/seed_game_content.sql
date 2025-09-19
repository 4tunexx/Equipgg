-- GAME CONTENT SEED DATA
-- Run this AFTER the main schema migration to restore all your game content
-- This includes: achievements, missions, items, ranks, badges, daily missions, perks, etc.

-- Insert comprehensive achievements
INSERT INTO achievements (id, title, description, tier, xp_reward, coin_reward, icon) VALUES
-- Betting Achievements
('getting-started', 'Getting Started', 'Place your first bet on any match and kick off your betting adventure!', 1, 50, 25, 'Swords'),
('first-victory', 'First Victory', 'Win your first bet and celebrate with a triumphant start.', 1, 100, 50, 'Trophy'),
('regular-bettor', 'Regular Bettor', 'Place a total of 50 bets and earn recognition as a regular player.', 2, 250, 125, 'User'),
('consistent-winner', 'Consistent Winner', 'Win 50 bets total and prove your prediction skills.', 2, 300, 150, 'Award'),
('heating-up', 'Heating Up', 'Win 3 bets in a row and feel the momentum building!', 2, 200, 100, 'Zap'),
('against-odds', 'Against The Odds', 'Win a bet on a team with odds of 3.0 or higher—defy the odds!', 3, 500, 250, 'Crown'),
('seasoned-veteran', 'Seasoned Veteran', 'Place 500 bets total and claim your veteran status.', 3, 750, 375, 'Shield'),
('master-predictor', 'Master Predictor', 'Win 250 bets and showcase your mastery of predictions.', 3, 1000, 500, 'Star'),
('high-roller', 'High Roller', 'Win a single bet with a payout over 10,000 coins—big wins await!', 4, 2000, 1000, 'Gem'),
('on-fire', 'On Fire!', 'Win 7 bets in a row and ignite your winning streak.', 4, 1500, 750, 'Zap'),

-- Economic Achievements  
('pocket-money', 'Pocket Money', 'Accumulate a total of 10,000 coins and start building your fortune.', 1, 100, 50, 'Coins'),
('first-sale', 'First Sale', 'Sell an item back to the shop for your first profitable trade.', 1, 75, 25, 'ShoppingBag'),
('unboxer', 'Unboxer', 'Open your first crate and discover the thrill of unboxing.', 1, 100, 50, 'FolderPlus'),
('perkaholic', 'Perkaholic', 'Buy any perk from the shop and enhance your gameplay.', 1, 125, 75, 'Sparkles'),
('well-off', 'Well Off', 'Accumulate a total of 100,000 coins and enjoy your wealth.', 2, 300, 200, 'Diamond'),
('contractor', 'Contractor', 'Complete your first Trade-Up Contract and unlock crafting rewards.', 2, 250, 125, 'ChevronsUp'),
('collector', 'Collector', 'Own 5 different "Rare" quality items at the same time—build your collection!', 2, 400, 200, 'Badge'),
('crate-connoisseur', 'Crate Connoisseur', 'Open 50 crates and become a crate-opening expert.', 3, 750, 375, 'FolderPlus'),
('master-crafter', 'Master Crafter', 'Complete 10 Trade-Up Contracts and master the art of crafting.', 3, 800, 400, 'ChevronsUp'),
('jackpot', 'Jackpot!', 'Unbox a Legendary item from a crate and hit the jackpot!', 4, 2500, 1250, 'Gem'),

-- Progression Achievements
('getting-serious', 'Getting Serious', 'Reach Level 10 and show you\'re committed to the grind.', 1, 200, 100, 'Gauge'),
('daily-grind', 'Daily Grind', 'Complete 10 Daily Missions and build your daily routine.', 1, 150, 75, 'CheckCircle'),
('quarter-century', 'Quarter Century Club', 'Reach Level 25 and join the elite quarter-century club!', 2, 500, 250, 'Star'),
('mission-accomplished', 'Mission Accomplished', 'Complete 5 Main Missions and start your epic campaign.', 2, 300, 150, 'Award'),
('halfway-there', 'Halfway There', 'Reach Level 50 and celebrate being halfway to the top!', 3, 1000, 500, 'Star'),
('loyalist', 'Loyalist', 'Log in 7 days in a row and prove your loyalty.', 2, 200, 100, 'Shield'),
('elite', 'Elite', 'Reach Level 75 and claim your elite status.', 3, 1500, 750, 'Crown'),
('pinnacle', 'The Pinnacle', 'Reach Level 100 and stand at the peak of progression.', 4, 2000, 1000, 'Crown'),
('habitual', 'Habitual', 'Log in 30 days in a row and make it a habit!', 3, 750, 375, 'CheckCircle'),
('completionist', 'Completionist', 'Complete all 50 Main Missions and become a true completionist.', 4, 5000, 2500, 'Award'),

-- Social & Community Achievements
('voice-crowd', 'Voice in the Crowd', 'Make your first post on the forums and join the conversation.', 1, 50, 25, 'MessageSquare'),
('interior-decorator', 'Interior Decorator', 'Customize your profile showcase for the first time and add your flair.', 1, 75, 50, 'Palette'),
('contributor', 'Contributor', 'Make 25 posts on the forums and become a valued contributor.', 2, 200, 100, 'MessageSquare'),
('socialite', 'Socialite', 'Successfully refer a friend who reaches Level 10 and grow the community.', 2, 300, 200, 'User'),
('weekly-top10', 'Weekly Top 10', 'Finish in the Top 10 on the weekly leaderboard and shine!', 3, 500, 300, 'Trophy'),
('forum-veteran', 'Forum Veteran', 'Make 100 posts on the forums and earn veteran status.', 3, 750, 400, 'MessageSquare'),

-- Arcade Game Achievements
('plinko-first', 'Plinko Beginner', 'Play your first Plinko game.', 1, 50, 25, 'Puzzle'),
('crash-first', 'Crash Survivor', 'Play your first Crash game.', 1, 50, 25, 'Rocket'),
('coinflip-first', 'Lucky Flip', 'Win your first Coinflip game.', 1, 75, 50, 'Coins'),
('sweeper-first', 'Mine Sweeper', 'Successfully clear 10 tiles in Sweeper without hitting a mine.', 2, 200, 100, 'Bomb'),
('plinko-master', 'Plinko Champion', 'Win 10x or more in a single Plinko drop.', 3, 500, 250, 'Puzzle'),
('crash-streak', 'Crash Master', 'Cash out successfully 3 times in a row in Crash.', 3, 400, 200, 'Rocket'),
('arcade-veteran', 'Arcade Veteran', 'Play 50 arcade games total.', 3, 750, 375, 'Gamepad2'),
('arcade-legend', 'Arcade Legend', 'Play 500 arcade games total.', 4, 2000, 1000, 'Crown')

ON CONFLICT (id) DO NOTHING;

-- Insert missions table structure
CREATE TABLE IF NOT EXISTS missions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL, -- 'daily' or 'main'
  tier INTEGER DEFAULT 1,
  xp_reward INTEGER DEFAULT 0,
  coin_reward INTEGER DEFAULT 0,
  crate_reward TEXT,
  requirements JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert daily missions
INSERT INTO missions (id, title, description, type, tier, xp_reward, coin_reward, requirements) VALUES
('daily-login', 'Daily Login', 'Log in to EquipGG.net today', 'daily', 1, 25, 50, '{"action": "login", "count": 1}'),
('daily-bet-1', 'Place a Bet', 'Place 1 bet on any match', 'daily', 1, 50, 75, '{"action": "place_bet", "count": 1}'),
('daily-bet-3', 'Triple Threat', 'Place 3 bets today', 'daily', 1, 100, 125, '{"action": "place_bet", "count": 3}'),
('daily-win-bet', 'Win a Bet', 'Win 1 bet today', 'daily', 1, 75, 100, '{"action": "win_bet", "count": 1}'),
('daily-arcade', 'Arcade Action', 'Play 3 arcade games', 'daily', 1, 50, 75, '{"action": "play_arcade", "count": 3}'),
('daily-crash', 'Crash Course', 'Play 2 Crash games', 'daily', 1, 40, 60, '{"action": "play_crash", "count": 2}'),
('daily-plinko', 'Plinko Drop', 'Play 5 Plinko games', 'daily', 1, 60, 80, '{"action": "play_plinko", "count": 5}'),
('daily-coinflip', 'Flip Out', 'Play 3 Coinflip games', 'daily', 1, 45, 65, '{"action": "play_coinflip", "count": 3}'),
('daily-sweeper', 'Mine Your Business', 'Play 2 Sweeper games', 'daily', 1, 55, 75, '{"action": "play_sweeper", "count": 2}'),
('daily-crate', 'Unbox Something', 'Open 1 crate', 'daily', 1, 75, 100, '{"action": "open_crate", "count": 1}'),
('daily-chat', 'Social Hour', 'Send 5 messages in chat', 'daily', 1, 30, 40, '{"action": "send_message", "count": 5}'),
('daily-leaderboard', 'Check the Rankings', 'Visit the leaderboard', 'daily', 1, 20, 30, '{"action": "visit_leaderboard", "count": 1}')

ON CONFLICT (id) DO NOTHING;

-- Insert main missions
INSERT INTO missions (id, title, description, type, tier, xp_reward, coin_reward, crate_reward, requirements) VALUES
('main-welcome', 'Welcome to EquipGG', 'Complete your profile setup', 'main', 1, 100, 200, null, '{"action": "setup_profile", "count": 1}'),
('main-first-bet', 'First Wager', 'Place your very first bet', 'main', 1, 150, 250, 'Starter Crate', '{"action": "place_bet", "count": 1}'),
('main-first-win', 'Taste of Victory', 'Win your first bet', 'main', 1, 200, 300, null, '{"action": "win_bet", "count": 1}'),
('main-level-5', 'Rising Star', 'Reach Level 5', 'main', 1, 250, 350, null, '{"action": "reach_level", "count": 5}'),
('main-10-bets', 'Getting Serious', 'Place 10 bets total', 'main', 1, 300, 400, null, '{"action": "place_bet", "count": 10}'),
('main-first-crate', 'Unboxing Fever', 'Open your first crate', 'main', 1, 150, 200, null, '{"action": "open_crate", "count": 1}'),
('main-win-streak', 'Hot Streak', 'Win 3 bets in a row', 'main', 2, 400, 500, 'Victory Crate', '{"action": "win_streak", "count": 3}'),
('main-level-10', 'Double Digits', 'Reach Level 10', 'main', 2, 500, 600, null, '{"action": "reach_level", "count": 10}'),
('main-50-bets', 'Veteran Bettor', 'Place 50 bets total', 'main', 2, 750, 800, null, '{"action": "place_bet", "count": 50}'),
('main-rare-item', 'Collector', 'Own a Rare quality item', 'main', 2, 300, 400, null, '{"action": "own_rare", "count": 1}'),
('main-arcade-master', 'Arcade Enthusiast', 'Play 25 arcade games', 'main', 2, 400, 500, null, '{"action": "play_arcade", "count": 25}'),
('main-level-25', 'Quarter Century', 'Reach Level 25', 'main', 3, 1000, 1200, 'Elite Crate', '{"action": "reach_level", "count": 25}'),
('main-100-bets', 'Betting Machine', 'Place 100 bets total', 'main', 3, 1200, 1500, null, '{"action": "place_bet", "count": 100}'),
('main-epic-item', 'Elite Collector', 'Own an Epic quality item', 'main', 3, 800, 1000, null, '{"action": "own_epic", "count": 1}'),
('main-high-roller', 'High Roller', 'Place a bet of 1000+ coins', 'main', 3, 600, 800, null, '{"action": "big_bet", "amount": 1000}'),
('main-level-50', 'Halfway Hero', 'Reach Level 50', 'main', 4, 2000, 2500, 'Legendary Crate', '{"action": "reach_level", "count": 50}'),
('main-legendary', 'Legendary Owner', 'Own a Legendary quality item', 'main', 4, 1500, 2000, null, '{"action": "own_legendary", "count": 1}'),
('main-millionaire', 'Millionaire', 'Accumulate 1,000,000 total coins', 'main', 5, 5000, 10000, 'Prestige Crate', '{"action": "total_coins", "amount": 1000000}')

ON CONFLICT (id) DO NOTHING;

-- Insert items and inventory
CREATE TABLE IF NOT EXISTS item_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

INSERT INTO item_categories (id, name, description) VALUES
('knives', 'Knives', 'Premium knife skins'),
('gloves', 'Gloves', 'Hand protection with style'),
('rifles', 'Rifles', 'Assault rifle skins'),
('pistols', 'Pistols', 'Sidearm weapon skins'),
('agents', 'Agents', 'Character operator skins'),
('stickers', 'Stickers', 'Weapon decoration stickers'),
('music-kits', 'Music Kits', 'Background music packages'),
('patches', 'Patches', 'Agent patches and badges')
ON CONFLICT (id) DO NOTHING;

-- Insert sample items
INSERT INTO items (id, name, type, rarity, image_url, market_value) VALUES
-- Legendary Knives
('karambit-doppler', 'Karambit | Doppler', 'knives', 'Legendary', '/items/karambit-doppler.jpg', 50000),
('butterfly-fade', 'Butterfly Knife | Fade', 'knives', 'Legendary', '/items/butterfly-fade.jpg', 45000),
('m9-crimson', 'M9 Bayonet | Crimson Web', 'knives', 'Legendary', '/items/m9-crimson.jpg', 40000),

-- Epic Gloves
('driver-crimson', 'Driver Gloves | Crimson Weave', 'gloves', 'Epic', '/items/driver-crimson.jpg', 8000),
('sport-superconductor', 'Sport Gloves | Superconductor', 'gloves', 'Epic', '/items/sport-super.jpg', 7500),
('specialist-emerald', 'Specialist Gloves | Emerald Web', 'gloves', 'Epic', '/items/specialist-emerald.jpg', 7000),

-- Rare Rifles
('ak47-redline', 'AK-47 | Redline', 'rifles', 'Rare', '/items/ak47-redline.jpg', 1500),
('m4a4-asiimov', 'M4A4 | Asiimov', 'rifles', 'Rare', '/items/m4a4-asiimov.jpg', 1200),
('awp-dragon-lore', 'AWP | Dragon Lore', 'rifles', 'Legendary', '/items/awp-dlore.jpg', 75000),

-- Uncommon Pistols
('glock-water', 'Glock-18 | Water Elemental', 'pistols', 'Uncommon', '/items/glock-water.jpg', 300),
('usp-orion', 'USP-S | Orion', 'pistols', 'Uncommon', '/items/usp-orion.jpg', 350),
('p250-asiimov', 'P250 | Asiimov', 'pistols', 'Uncommon', '/items/p250-asiimov.jpg', 250),

-- Common items
('mp7-gunsmoke', 'MP7 | Gunsmoke', 'smgs', 'Common', '/items/mp7-gunsmoke.jpg', 50),
('nova-walnut', 'Nova | Walnut', 'shotguns', 'Common', '/items/nova-walnut.jpg', 25),
('p90-ash-wood', 'P90 | Ash Wood', 'smgs', 'Common', '/items/p90-ash.jpg', 40)

ON CONFLICT (id) DO NOTHING;

-- Insert perks/powerups
CREATE TABLE IF NOT EXISTS perks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  duration_hours INTEGER,
  effect_type TEXT NOT NULL,
  effect_value DECIMAL,
  icon TEXT,
  is_active BOOLEAN DEFAULT true
);

INSERT INTO perks (id, name, description, price, duration_hours, effect_type, effect_value, icon) VALUES
('xp-boost-small', 'XP Boost (1h)', 'Double XP for 1 hour', 100, 1, 'xp_multiplier', 2.0, 'Zap'),
('xp-boost-medium', 'XP Boost (6h)', 'Double XP for 6 hours', 500, 6, 'xp_multiplier', 2.0, 'Zap'),
('xp-boost-large', 'XP Boost (24h)', 'Double XP for 24 hours', 1500, 24, 'xp_multiplier', 2.0, 'Zap'),
('coin-boost-small', 'Coin Boost (1h)', '+50% coin rewards for 1 hour', 150, 1, 'coin_multiplier', 1.5, 'Coins'),
('coin-boost-medium', 'Coin Boost (6h)', '+50% coin rewards for 6 hours', 750, 6, 'coin_multiplier', 1.5, 'Coins'),
('luck-boost', 'Lucky Charm (2h)', '+25% better crate odds for 2 hours', 300, 2, 'luck_boost', 1.25, 'Sparkles'),
('daily-double', 'Daily Double', 'Double daily mission rewards (today only)', 200, 24, 'daily_multiplier', 2.0, 'CheckCircle'),
('insurance', 'Bet Insurance', 'Get 50% back on next lost bet', 500, 168, 'bet_insurance', 0.5, 'Shield'),
('vip-1day', 'VIP Status (1 day)', 'VIP perks for 24 hours', 1000, 24, 'vip_status', 1.0, 'Crown'),
('vip-7day', 'VIP Status (7 days)', 'VIP perks for 7 days', 5000, 168, 'vip_status', 1.0, 'Crown')
ON CONFLICT (id) DO NOTHING;

-- Insert rank/level system
CREATE TABLE IF NOT EXISTS rank_tiers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  min_level INTEGER NOT NULL,
  max_level INTEGER,
  color TEXT,
  icon TEXT,
  benefits TEXT
);

INSERT INTO rank_tiers (id, name, min_level, max_level, color, icon, benefits) VALUES
(1, 'Newcomer', 1, 9, '#8B5A3C', 'Shield', 'Basic features'),
(2, 'Explorer', 10, 24, '#C0C0C0', 'User', 'Daily bonus +25%'),
(3, 'Adventurer', 25, 49, '#CD7F32', 'Star', 'Daily bonus +50%, Trade-up unlocked'),
(4, 'Veteran', 50, 74, '#C0C0C0', 'Award', 'Daily bonus +75%, VIP chat badge'),
(5, 'Elite', 75, 99, '#FFD700', 'Crown', 'Daily bonus +100%, Priority support'),
(6, 'Legend', 100, 149, '#E5E4E2', 'Trophy', 'Daily bonus +150%, Custom badge'),
(7, 'Mythic', 150, 199, '#9966CC', 'Gem', 'Daily bonus +200%, Exclusive items'),
(8, 'Immortal', 200, null, '#FF6347', 'Diamond', 'All benefits maxed')
ON CONFLICT (id) DO NOTHING;

-- Update site settings with game configuration
INSERT INTO site_settings (key, value, description) VALUES
('xp_per_level', '{"base": 1000, "multiplier": 1.2}', 'XP required per level calculation'),
('daily_login_bonus', '100', 'Base daily login coin bonus'),
('max_daily_missions', '5', 'Maximum daily missions per day'),
('crate_base_price', '250', 'Base price for standard crates'),
('trade_up_unlock_level', '25', 'Level required to unlock trade-up contracts'),
('prestige_unlock_level', '100', 'Level required for first prestige'),
('vip_daily_bonus_multiplier', '2.0', 'VIP daily bonus multiplier'),
('arcade_base_bet', '10', 'Minimum bet amount for arcade games'),
('max_bet_percentage', '0.5', 'Maximum bet as percentage of user balance')
ON CONFLICT (key) DO NOTHING;

-- Add sample flash sales and featured items
UPDATE site_settings SET value = '[
  {
    "id": "weekend-special",
    "title": "Weekend Warrior Pack",
    "description": "XP Boost + Coin Boost combo",
    "original_price": 1000,
    "sale_price": 750,
    "discount": 25,
    "expires_at": "2025-09-22T00:00:00Z",
    "items": ["xp-boost-medium", "coin-boost-medium"]
  }
]' WHERE key = 'flash_sales';

UPDATE site_settings SET value = '[
  {"id": "karambit-doppler", "featured": true, "boost": "trending"},
  {"id": "driver-crimson", "featured": true, "boost": "hot"},
  {"id": "ak47-redline", "featured": true, "boost": "popular"}
]' WHERE key = 'featured_items';

-- Create leaderboard materialized view for performance
CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard_cache AS
SELECT 
  u.id,
  u.display_name,
  u.avatar_url,
  u.xp,
  u.level,
  u.role,
  u.coins,
  u.wins,
  u.matches_played,
  CASE WHEN u.matches_played > 0 THEN ROUND((u.wins::DECIMAL / u.matches_played) * 100, 1) ELSE 0 END as win_percentage,
  ROW_NUMBER() OVER (ORDER BY u.xp DESC, u.level DESC, u.coins DESC) as rank,
  rt.name as rank_tier,
  rt.color as rank_color,
  rt.icon as rank_icon
FROM users u
LEFT JOIN rank_tiers rt ON u.level >= rt.min_level AND (rt.max_level IS NULL OR u.level <= rt.max_level)
WHERE u.is_banned = false
ORDER BY u.xp DESC, u.level DESC, u.coins DESC;

-- Create refresh function for leaderboard
CREATE OR REPLACE FUNCTION refresh_leaderboard_cache()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW leaderboard_cache;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh (you can call this periodically)
-- SELECT refresh_leaderboard_cache();

SELECT 'Game content seed completed! Achievements, missions, items, perks, and ranks have been restored.' as status;