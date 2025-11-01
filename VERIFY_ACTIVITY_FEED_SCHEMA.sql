-- =====================================================
-- VERIFY ACTIVITY_FEED SCHEMA
-- =====================================================
-- Run this in Supabase SQL Editor to check the actual column type
-- =====================================================

-- Check the actual column type in PostgreSQL
SELECT 
    table_name,
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'activity_feed'
  AND column_name = 'user_id';

-- Check if there are any constraints on user_id
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.activity_feed'::regclass
  AND conname LIKE '%user_id%';

-- Check indexes on user_id
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'activity_feed'
  AND indexname LIKE '%user_id%';

-- Test query with Steam ID (should work if column is TEXT)
SELECT * FROM activity_feed 
WHERE user_id = 'steam-76561198001993310' 
ORDER BY created_at DESC 
LIMIT 1;

