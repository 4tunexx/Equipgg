-- =====================================================
-- TEST ACTION COLUMN IN ACTIVITY_FEED
-- =====================================================
-- Run this to check if the action column works with PostgREST filters
-- =====================================================

-- Check if action column exists and its type
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'activity_feed'
  AND column_name IN ('action', 'user_id');

-- Test query with action filter (this should work in SQL)
SELECT * FROM activity_feed 
WHERE user_id = 'steam-76561198001993310' 
  AND action = 'opened_crate'
ORDER BY created_at DESC 
LIMIT 1;

-- Check what action values exist for this user
SELECT DISTINCT action, COUNT(*) 
FROM activity_feed 
WHERE user_id = 'steam-76561198001993310'
GROUP BY action;

-- Check if any opened_crate actions exist
SELECT COUNT(*) 
FROM activity_feed 
WHERE user_id = 'steam-76561198001993310'
  AND action = 'opened_crate';

