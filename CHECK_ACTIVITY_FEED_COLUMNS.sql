-- =====================================================
-- CHECK ACTIVITY_FEED COLUMNS
-- =====================================================
-- Run this to see what columns actually exist
-- =====================================================

-- Check all columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'activity_feed'
ORDER BY ordinal_position;

-- Try the exact query that's failing
SELECT id, user_id, action, item_id, icon, xp, created_at
FROM activity_feed 
WHERE user_id = 'steam-76561198001993310'
ORDER BY created_at DESC 
LIMIT 10;

-- Try without icon column (maybe it doesn't exist?)
SELECT id, user_id, action, item_id, xp, created_at
FROM activity_feed 
WHERE user_id = 'steam-76561198001993310'
ORDER BY created_at DESC 
LIMIT 10;

