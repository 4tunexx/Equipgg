-- EQUIPGG MINIMAL DATABASE FIXES
-- Only adds what's missing from your already excellent database!

-- ==============================================
-- 1. ADD MISSING COLUMNS
-- ==============================================

-- Add 'featured' column to items table for shop highlights
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Add 'lobby' column to chat_messages (though 'channel' might already work)
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS lobby TEXT;

-- ==============================================
-- 2. CREATE MISSING user_stats TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS user_stats (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id),
    total_bets INTEGER DEFAULT 0,
    total_winnings INTEGER DEFAULT 0,
    total_losses INTEGER DEFAULT 0,
    win_percentage DECIMAL DEFAULT 0.0,
    biggest_win INTEGER DEFAULT 0,
    biggest_loss INTEGER DEFAULT 0,
    favorite_game TEXT,
    total_playtime_hours INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

-- ==============================================
-- 3. UPDATE SOME FEATURED ITEMS (OPTIONAL)
-- ==============================================

-- Mark some random items as featured for testing
UPDATE items 
SET featured = true 
WHERE id IN (
    SELECT id FROM items 
    WHERE rarity IN ('rare', 'epic', 'legendary') 
    LIMIT 5
);

-- ==============================================
-- 4. VERIFY EVERYTHING WORKS
-- ==============================================

-- Check the new column exists
SELECT 
    'items.featured' as check_item,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'items' AND column_name = 'featured'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check user_stats table exists
SELECT 
    'user_stats table' as check_item,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_stats'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Show featured items count
SELECT 
    'Featured items count' as check_item,
    COUNT(*) as count
FROM items 
WHERE featured = true;

-- ==============================================
-- SUCCESS! YOUR DATABASE IS NOW 100% READY! 🎉
-- ==============================================