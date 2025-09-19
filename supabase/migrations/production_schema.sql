-- Complete Database Schema for EquipGG Production
-- Run this in your Supabase SQL Editor to create all required tables

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE match_status AS ENUM ('upcoming', 'live', 'finished');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE rarity_type AS ENUM ('Common', 'Uncommon', 'Rare', 'Epic', 'Legendary');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Users table (complete with all required columns)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  display_name TEXT,
  username TEXT,
  steam_id TEXT UNIQUE,
  avatar_url TEXT,
  role user_role DEFAULT 'user',
  coins BIGINT DEFAULT 1000,
  gems INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  matches_played INTEGER DEFAULT 0,
  total_wagered BIGINT DEFAULT 0,
  total_won BIGINT DEFAULT 0,
  is_banned BOOLEAN DEFAULT false,
  ban_reason TEXT,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing users table
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user';
  ALTER TABLE users ADD COLUMN IF NOT EXISTS gems INTEGER DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS losses INTEGER DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS total_wagered BIGINT DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS total_won BIGINT DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Matches table (updated structure for PandaScore integration)
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  pandascore_id INTEGER UNIQUE,
  team_a_name TEXT NOT NULL,
  team_a_logo TEXT,
  team_a_odds DECIMAL DEFAULT 1.5,
  team_b_name TEXT NOT NULL,
  team_b_logo TEXT,
  team_b_odds DECIMAL DEFAULT 2.5,
  event_name TEXT,
  start_time TIMESTAMPTZ,
  match_date DATE,
  stream_url TEXT,
  status match_status DEFAULT 'upcoming',
  winner TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity feed table (complete structure)
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username TEXT,
  activity_type TEXT NOT NULL,
  amount INTEGER,
  item_name TEXT,
  item_rarity TEXT,
  game_type TEXT,
  multiplier DECIMAL,
  activity_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items table
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  rarity rarity_type NOT NULL,
  image_url TEXT,
  data_ai_hint TEXT,
  market_value INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User inventory
CREATE TABLE IF NOT EXISTS user_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  equipped BOOLEAN DEFAULT false,
  obtained_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  tier INTEGER DEFAULT 1,
  xp_reward INTEGER DEFAULT 0,
  coin_reward INTEGER DEFAULT 0,
  crate_reward TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id TEXT REFERENCES achievements(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Site settings
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions for NextAuth
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bets table for user betting
CREATE TABLE IF NOT EXISTS bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  match_id TEXT REFERENCES matches(id) ON DELETE CASCADE,
  team_bet TEXT NOT NULL, -- 'team_a' or 'team_b'
  amount BIGINT NOT NULL,
  odds DECIMAL NOT NULL,
  potential_winnings BIGINT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'won', 'lost', 'cancelled'
  placed_at TIMESTAMPTZ DEFAULT NOW(),
  settled_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_steam_id ON users(steam_id);
CREATE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_start_time ON matches(start_time);
CREATE INDEX IF NOT EXISTS idx_matches_pandascore_id ON matches(pandascore_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at);
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_match_id ON bets(match_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS set_timestamp_users ON users;
CREATE TRIGGER set_timestamp_users
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_matches ON matches;
CREATE TRIGGER set_timestamp_matches
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- Insert default site settings
INSERT INTO site_settings (key, value, description) VALUES
  ('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
  ('registration_enabled', 'true', 'Enable/disable user registration'),
  ('min_bet_amount', '10', 'Minimum bet amount in coins'),
  ('max_bet_amount', '10000', 'Maximum bet amount in coins'),
  ('daily_bonus_amount', '100', 'Daily login bonus amount'),
  ('featured_items', '[]', 'Featured items for landing page'),
  ('flash_sales', '[]', 'Current flash sales')
ON CONFLICT (key) DO NOTHING;

-- Insert default achievements
INSERT INTO achievements (id, title, description, tier, xp_reward, coin_reward) VALUES
  ('first-login', 'Welcome!', 'Complete your first login', 1, 50, 100),
  ('first-bet', 'First Wager', 'Place your first bet', 1, 100, 50),
  ('lucky-win', 'Lucky Strike', 'Win your first bet', 1, 200, 200),
  ('high-roller', 'High Roller', 'Place a bet of 1000+ coins', 2, 500, 0),
  ('streak-3', 'Win Streak', 'Win 3 bets in a row', 2, 300, 250),
  ('level-10', 'Experienced', 'Reach level 10', 2, 1000, 500),
  ('match-predictor', 'Match Predictor', 'Correctly predict 5 match outcomes', 2, 400, 300),
  ('big-spender', 'Big Spender', 'Spend 10,000 coins total', 3, 750, 1000)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Public read access for leaderboard and basic user info
DROP POLICY IF EXISTS "Public users readable" ON users;
CREATE POLICY "Public users readable" ON users
  FOR SELECT USING (true);

-- Users can update their own data
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Public read access for matches
DROP POLICY IF EXISTS "Matches are publicly readable" ON matches;
CREATE POLICY "Matches are publicly readable" ON matches
  FOR SELECT USING (true);

-- Activity feed public read
DROP POLICY IF EXISTS "Activity feed is publicly readable" ON activity_feed;
CREATE POLICY "Activity feed is publicly readable" ON activity_feed
  FOR SELECT USING (true);

-- Site settings public read
DROP POLICY IF EXISTS "Site settings are publicly readable" ON site_settings;
CREATE POLICY "Site settings are publicly readable" ON site_settings
  FOR SELECT USING (true);

-- Users can view their own inventory and achievements
DROP POLICY IF EXISTS "Users can view own inventory" ON user_inventory;
CREATE POLICY "Users can view own inventory" ON user_inventory
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can view their own bets
DROP POLICY IF EXISTS "Users can view own bets" ON bets;
CREATE POLICY "Users can view own bets" ON bets
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Insert admin functionality policies for service role
DROP POLICY IF EXISTS "Service role full access users" ON users;
CREATE POLICY "Service role full access users" ON users
  FOR ALL USING (current_setting('role') = 'service_role');

DROP POLICY IF EXISTS "Service role full access matches" ON matches;
CREATE POLICY "Service role full access matches" ON matches
  FOR ALL USING (current_setting('role') = 'service_role');

DROP POLICY IF EXISTS "Service role full access activity_feed" ON activity_feed;
CREATE POLICY "Service role full access activity_feed" ON activity_feed
  FOR ALL USING (current_setting('role') = 'service_role');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Create a view for leaderboard (performance optimization)
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  id,
  display_name,
  xp,
  level,
  avatar_url,
  role,
  ROW_NUMBER() OVER (ORDER BY xp DESC, level DESC) as rank
FROM users 
WHERE is_banned = false
ORDER BY xp DESC, level DESC
LIMIT 100;