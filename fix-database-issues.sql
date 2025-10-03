-- IMMEDIATE DATABASE FIXES REQUIRED
-- Run these SQL commands in Supabase SQL Editor to fix critical issues

-- ==============================================
-- 1. FIX MISSING COLUMNS (CRITICAL)
-- ==============================================

-- Add featured column to items table (for featured items page)
ALTER TABLE items ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Add lobby column to chat_messages table (for chat room separation)
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS lobby VARCHAR(50) DEFAULT 'general';

-- Update some items to be featured (for featured items page to work)
UPDATE items SET featured = true WHERE id IN (
  SELECT id FROM items ORDER BY RANDOM() LIMIT 10
);

-- ==============================================
-- 2. POPULATE EMPTY USER DATA TABLES (CRITICAL)
-- ==============================================

-- Create sample user achievements (so achievement system shows data)
WITH selected_users AS (
  SELECT id FROM users LIMIT 4
),
selected_achievements AS (
  SELECT id FROM achievements ORDER BY RANDOM() LIMIT 15
)
INSERT INTO user_achievements (user_id, achievement_id, unlocked_at, progress)
SELECT 
  u.id, 
  a.id, 
  NOW() - INTERVAL '1 day' * (RANDOM() * 30), 
  100
FROM selected_users u
CROSS JOIN selected_achievements a
ON CONFLICT DO NOTHING;

-- Create sample user inventory (so inventory page shows items)
WITH selected_users AS (
  SELECT id FROM users LIMIT 4
),
selected_items AS (
  SELECT id FROM items WHERE coin_price > 0 ORDER BY RANDOM() LIMIT 20
)
INSERT INTO user_inventory (user_id, item_id, quantity, acquired_at)
SELECT 
  u.id, 
  i.id, 
  CASE WHEN RANDOM() > 0.7 THEN 2 ELSE 1 END, -- Sometimes multiple quantities
  NOW() - INTERVAL '1 day' * (RANDOM() * 14)
FROM selected_users u
CROSS JOIN selected_items i
WHERE RANDOM() > 0.6 -- Only 40% chance per user-item combination
ON CONFLICT DO NOTHING;

-- Create user stats (for statistics tracking)
INSERT INTO user_stats (user_id, total_matches, total_wins, total_earnings, created_at)
SELECT 
  id,
  FLOOR(RANDOM() * 50 + 5)::INTEGER, -- 5-55 matches
  FLOOR(RANDOM() * 25 + 2)::INTEGER, -- 2-27 wins
  FLOOR(RANDOM() * 10000 + 500)::INTEGER, -- 500-10500 earnings
  NOW()
FROM users
ON CONFLICT (user_id) DO UPDATE SET
  total_matches = EXCLUDED.total_matches,
  total_wins = EXCLUDED.total_wins,
  total_earnings = EXCLUDED.total_earnings;

-- Create mission progress (so mission system shows progress)
WITH selected_users AS (
  SELECT id FROM users LIMIT 4
),
selected_missions AS (
  SELECT id FROM missions WHERE mission_type IN ('daily', 'weekly') ORDER BY RANDOM() LIMIT 12
)
INSERT INTO user_mission_progress (user_id, mission_id, progress, completed_at, created_at)
SELECT 
  u.id,
  m.id,
  FLOOR(RANDOM() * 100)::INTEGER, -- 0-100% progress
  CASE WHEN RANDOM() > 0.7 THEN NOW() - INTERVAL '1 day' * (RANDOM() * 7) ELSE NULL END, -- 30% completed
  NOW() - INTERVAL '1 day' * (RANDOM() * 3)
FROM selected_users u
CROSS JOIN selected_missions m
WHERE RANDOM() > 0.5 -- 50% chance per user-mission combination
ON CONFLICT DO NOTHING;

-- Create user ranks (for rank progression)
INSERT INTO user_ranks (user_id, rank_id, achieved_at)
SELECT 
  u.id,
  r.id,
  NOW() - INTERVAL '1 day' * (RANDOM() * 30)
FROM users u
CROSS JOIN ranks r
WHERE r.tier <= (CASE 
  WHEN u.level >= 40 THEN 5
  WHEN u.level >= 25 THEN 4
  WHEN u.level >= 15 THEN 3
  WHEN u.level >= 8 THEN 2
  ELSE 1
END)
ON CONFLICT DO NOTHING;

-- Create user badges (for badge collection)
WITH selected_users AS (
  SELECT id FROM users LIMIT 4
),
selected_badges AS (
  SELECT id FROM badges ORDER BY RANDOM() LIMIT 10
)
INSERT INTO user_badges (user_id, badge_id, earned_at)
SELECT 
  u.id,
  b.id,
  NOW() - INTERVAL '1 day' * (RANDOM() * 60)
FROM selected_users u
CROSS JOIN selected_badges b
WHERE RANDOM() > 0.7 -- 30% chance per user-badge combination
ON CONFLICT DO NOTHING;

-- Create sample notifications (for notification system)
INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
SELECT 
  id,
  CASE FLOOR(RANDOM() * 4)
    WHEN 0 THEN 'achievement'
    WHEN 1 THEN 'reward'
    WHEN 2 THEN 'system'
    ELSE 'update'
  END,
  CASE FLOOR(RANDOM() * 4)
    WHEN 0 THEN 'Achievement Unlocked!'
    WHEN 1 THEN 'Daily Reward Available'
    WHEN 2 THEN 'System Maintenance'
    ELSE 'New Features Added'
  END,
  CASE FLOOR(RANDOM() * 4)
    WHEN 0 THEN 'You have unlocked a new achievement. Check your profile!'
    WHEN 1 THEN 'Your daily login reward is ready to claim.'
    WHEN 2 THEN 'Scheduled maintenance will occur tonight at 2 AM UTC.'
    ELSE 'Check out the new features in the latest update!'
  END,
  RANDOM() > 0.6, -- 40% unread notifications
  NOW() - INTERVAL '1 hour' * (RANDOM() * 72) -- Within last 3 days
FROM users
CROSS JOIN LATERAL generate_series(1, FLOOR(RANDOM() * 3 + 1)::INTEGER) -- 1-3 notifications per user
ON CONFLICT DO NOTHING;

-- Add some flash sales (so flash sales page works)
INSERT INTO flash_sales (item_id, discount_percentage, original_price, sale_price, start_time, end_time, created_at)
SELECT 
  i.id,
  FLOOR(RANDOM() * 50 + 10)::INTEGER, -- 10-60% discount
  i.coin_price,
  FLOOR(i.coin_price * (1 - (RANDOM() * 0.5 + 0.1)))::INTEGER, -- Apply discount
  NOW() - INTERVAL '1 hour' * (RANDOM() * 24), -- Started within last day
  NOW() + INTERVAL '1 hour' * (RANDOM() * 48 + 12), -- Ends within next 12-60 hours
  NOW()
FROM items i
WHERE i.coin_price > 0 AND i.is_active = true
ORDER BY RANDOM()
LIMIT 8
ON CONFLICT DO NOTHING;

-- ==============================================
-- 3. UPDATE EXISTING DATA FOR BETTER TESTING
-- ==============================================

-- Give users some coins and gems for testing purchases
UPDATE users SET 
  coins = GREATEST(coins, 5000 + FLOOR(RANDOM() * 10000)::INTEGER),
  gems = GREATEST(gems, 100 + FLOOR(RANDOM() * 500)::INTEGER),
  xp = GREATEST(xp, FLOOR(RANDOM() * 15000 + 1000)::INTEGER)
WHERE coins < 1000 OR gems < 50;

-- Update user levels based on XP
UPDATE users SET level = LEAST(FLOOR(xp / 1000) + 1, 50);

-- Set some items to have proper prices (for shop testing)
UPDATE items SET 
  coin_price = CASE 
    WHEN coin_price = 0 AND gem_price = 0 THEN FLOOR(RANDOM() * 2000 + 100)
    ELSE coin_price
  END,
  gem_price = CASE 
    WHEN coin_price = 0 AND gem_price = 0 THEN FLOOR(RANDOM() * 50 + 5)
    WHEN RANDOM() > 0.7 THEN FLOOR(RANDOM() * 100 + 10)
    ELSE gem_price
  END
WHERE (coin_price = 0 AND gem_price = 0) OR RANDOM() > 0.8;

-- ==============================================
-- 4. VERIFICATION QUERIES
-- ==============================================

-- Check if fixes worked:
SELECT 'featured_items' as check_type, COUNT(*) as count FROM items WHERE featured = true;
SELECT 'user_achievements' as check_type, COUNT(*) as count FROM user_achievements;
SELECT 'user_inventory' as check_type, COUNT(*) as count FROM user_inventory;
SELECT 'user_stats' as check_type, COUNT(*) as count FROM user_stats;
SELECT 'user_mission_progress' as check_type, COUNT(*) as count FROM user_mission_progress;
SELECT 'notifications' as check_type, COUNT(*) as count FROM notifications;
SELECT 'flash_sales' as check_type, COUNT(*) as count FROM flash_sales;

-- Check user data summary:
SELECT 
  u.username,
  u.coins,
  u.gems,
  u.xp,
  u.level,
  (SELECT COUNT(*) FROM user_achievements WHERE user_id = u.id) as achievements,
  (SELECT COUNT(*) FROM user_inventory WHERE user_id = u.id) as inventory_items,
  (SELECT COUNT(*) FROM notifications WHERE user_id = u.id) as notifications
FROM users u;