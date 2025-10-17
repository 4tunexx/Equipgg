-- Critical fixes for admin panel functionality
-- Run this in Supabase SQL Editor

-- 1. Create site_settings table (required for page toggles)
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type VARCHAR(50) DEFAULT 'string',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);

-- 2. Fix activity_feed table structure to match API expectations
-- Drop the old table if it exists with wrong structure
DROP TABLE IF EXISTS activity_feed CASCADE;

-- Recreate with correct structure
CREATE TABLE activity_feed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  amount INTEGER DEFAULT 0,
  item_name VARCHAR(255),
  item_rarity VARCHAR(50),
  game_type VARCHAR(50),
  multiplier DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON activity_feed(activity_type);

-- 3. Enable RLS for site_settings (admins can read/write, users can only read)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to site_settings"
  ON site_settings FOR SELECT
  USING (true);

CREATE POLICY "Allow service role full access to site_settings"
  ON site_settings FOR ALL
  USING (true);

-- 4. Enable RLS for activity_feed (everyone can read, system can write)
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to activity_feed"
  ON activity_feed FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert their own activities"
  ON activity_feed FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow service role full access to activity_feed"
  ON activity_feed FOR ALL
  USING (true);

-- 5. Seed some initial activity data for testing
INSERT INTO activity_feed (user_id, activity_type, description, amount, created_at)
SELECT 
  id::uuid as user_id,
  'level_up' as activity_type,
  'reached level ' || level::text as description,
  level * 100 as amount,
  NOW() - (random() * interval '7 days') as created_at
FROM users
WHERE level > 1
LIMIT 10
ON CONFLICT DO NOTHING;

INSERT INTO activity_feed (user_id, activity_type, description, amount, game_type, created_at)
SELECT 
  id::uuid as user_id,
  'game_win' as activity_type,
  'won ' || (coins / 10)::text || ' coins on crash' as description,
  coins / 10 as amount,
  'crash' as game_type,
  NOW() - (random() * interval '3 days') as created_at
FROM users
WHERE coins > 100
LIMIT 15
ON CONFLICT DO NOTHING;
