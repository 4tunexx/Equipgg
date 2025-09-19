-- EquipGG Production Database Migration
-- This will fix all the column and table name issues

-- Drop existing problematic tables
DROP TABLE IF EXISTS user_activity_feed CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;

-- Create users table with correct column names (display_name not displayName)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  steam_id TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  coins DECIMAL DEFAULT 1000,
  wins INTEGER DEFAULT 0,
  matches_played INTEGER DEFAULT 0,
  role TEXT DEFAULT 'user',
  is_banned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  team1_name TEXT NOT NULL,
  team2_name TEXT NOT NULL,
  team1_logo TEXT,
  team2_logo TEXT,
  league_name TEXT,
  status TEXT DEFAULT 'scheduled',
  scheduled_at TIMESTAMPTZ,
  team1_odds DECIMAL,
  team2_odds DECIMAL,
  winner_id TEXT,
  pandascore_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create activity_feed table (correct name, not user_activity_feed)
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tier INTEGER DEFAULT 1,
  xp_reward INTEGER DEFAULT 0,
  coin_reward INTEGER DEFAULT 0,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bets table
CREATE TABLE IF NOT EXISTS bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  match_id TEXT REFERENCES matches(id),
  amount DECIMAL NOT NULL,
  team_bet TEXT NOT NULL,
  odds DECIMAL NOT NULL,
  status TEXT DEFAULT 'pending',
  potential_payout DECIMAL,
  actual_payout DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  rarity TEXT NOT NULL,
  image_url TEXT,
  market_value DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_inventory table
CREATE TABLE IF NOT EXISTS user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  item_id TEXT REFERENCES items(id),
  quantity INTEGER DEFAULT 1,
  acquired_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Public read matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Public read achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "Public read items" ON items FOR SELECT USING (true);

CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can read own activity" ON activity_feed FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can read own bets" ON bets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bets" ON bets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own inventory" ON user_inventory FOR SELECT USING (auth.uid() = user_id);

-- Insert core achievements
INSERT INTO achievements (id, title, description, tier, xp_reward, coin_reward, icon) VALUES
('getting-started', 'Getting Started', 'Place your first bet on any match', 1, 50, 25, 'Swords'),
('first-victory', 'First Victory', 'Win your first bet', 1, 100, 50, 'Trophy'),
('regular-bettor', 'Regular Bettor', 'Place a total of 50 bets', 2, 250, 125, 'User'),
('consistent-winner', 'Consistent Winner', 'Win 50 bets total', 2, 300, 150, 'Award'),
('heating-up', 'Heating Up', 'Win 3 bets in a row', 2, 200, 100, 'Zap'),
('against-odds', 'Against The Odds', 'Win a bet with odds of 3.0 or higher', 3, 500, 250, 'Crown'),
('seasoned-veteran', 'Seasoned Veteran', 'Place 500 bets total', 3, 750, 375, 'Shield'),
('master-predictor', 'Master Predictor', 'Win 250 bets total', 3, 1000, 500, 'Star'),
('high-roller', 'High Roller', 'Win a single bet with payout over 10,000 coins', 4, 2000, 1000, 'Gem'),
('on-fire', 'On Fire!', 'Win 7 bets in a row', 4, 1500, 750, 'Zap')
ON CONFLICT (id) DO NOTHING;

-- Insert sample items
INSERT INTO items (id, name, type, rarity, market_value) VALUES
('ak47-redline', 'AK-47 | Redline', 'rifles', 'Rare', 1500),
('karambit-doppler', 'Karambit | Doppler', 'knives', 'Legendary', 50000),
('glock-water', 'Glock-18 | Water Elemental', 'pistols', 'Uncommon', 300),
('driver-crimson', 'Driver Gloves | Crimson Weave', 'gloves', 'Epic', 8000),
('m4a4-asiimov', 'M4A4 | Asiimov', 'rifles', 'Rare', 1200)
ON CONFLICT (id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_steam_id ON users(steam_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_scheduled ON matches(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_match_id ON bets(match_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON user_inventory(user_id);

SELECT 'Database migration completed successfully!' as status;