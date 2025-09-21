-- Fix missing database components
-- Run this SQL directly in Supabase SQL Editor

-- 1. Add vip_tier column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_tier INTEGER DEFAULT 0;

-- 2. Create mission_progress table
CREATE TABLE IF NOT EXISTS mission_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, mission_id)
);

-- Create indexes for mission_progress
CREATE INDEX IF NOT EXISTS idx_mission_progress_user_id ON mission_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_mission_progress_mission_id ON mission_progress(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_progress_completed ON mission_progress(completed);

-- 3. Create shop_items table
CREATE TABLE IF NOT EXISTS shop_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  subcategory VARCHAR(100),
  rarity VARCHAR(50) DEFAULT 'common',
  coin_price INTEGER DEFAULT 0,
  gem_price INTEGER DEFAULT 0,
  image_url TEXT,
  stock INTEGER DEFAULT -1,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for shop_items
CREATE INDEX IF NOT EXISTS idx_shop_items_category ON shop_items(category);
CREATE INDEX IF NOT EXISTS idx_shop_items_rarity ON shop_items(rarity);
CREATE INDEX IF NOT EXISTS idx_shop_items_active ON shop_items(is_active);

-- 4. Insert sample shop items
INSERT INTO shop_items (name, description, category, rarity, gem_price, image_url) VALUES
('Premium Crate Key', 'Unlock premium crates with rare items', 'keys', 'rare', 100, '/assets/items/premium-key.png'),
('XP Booster (24h)', 'Double XP gain for 24 hours', 'boosters', 'epic', 0, '/assets/items/xp-booster.png'),
('Coin Multiplier', 'Increase coin rewards by 50% for 12 hours', 'boosters', 'rare', 75, '/assets/items/coin-multiplier.png'),
('VIP Pass (7 days)', 'Access to VIP features for 7 days', 'vip', 'legendary', 500, '/assets/items/vip-pass.png'),
('Gem Pack (Small)', '100 gems for purchases', 'currency', 'common', 0, '/assets/items/gem-pack-small.png')
ON CONFLICT DO NOTHING;

-- Update XP Booster to use coin price instead
UPDATE shop_items SET coin_price = 5000, gem_price = 0 WHERE name = 'XP Booster (24h)';

-- 5. Add sample mission progress for existing users
INSERT INTO mission_progress (user_id, mission_id, progress, completed, completed_at)
SELECT 
  u.id as user_id,
  m.id as mission_id,
  CASE 
    WHEN random() > 0.7 THEN m.requirement_value
    ELSE floor(random() * m.requirement_value)::integer
  END as progress,
  CASE 
    WHEN random() > 0.7 THEN true
    ELSE false
  END as completed,
  CASE 
    WHEN random() > 0.7 THEN NOW() - (random() * interval '30 days')
    ELSE NULL
  END as completed_at
FROM users u
CROSS JOIN missions m
WHERE u.role = 'user'
LIMIT 20
ON CONFLICT (user_id, mission_id) DO NOTHING;

-- 6. Update users with random vip_tier values
UPDATE users SET vip_tier = floor(random() * 4)::integer WHERE vip_tier IS NULL;

COMMIT;