-- =====================================================
-- VERIFY ACTIVITY_FEED COLUMN TYPE
-- =====================================================
-- Run this first to see what the actual column type is
-- =====================================================

-- Check column type in information_schema
SELECT 
    table_name,
    column_name,
    data_type,
    udt_name,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'activity_feed'
  AND column_name = 'user_id';

-- Check column type in pg_catalog (more direct)
SELECT 
    a.attname AS column_name,
    pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
    a.attnotnull AS not_null
FROM pg_catalog.pg_attribute a
JOIN pg_catalog.pg_class c ON a.attrelid = c.oid
JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relname = 'activity_feed'
  AND a.attname = 'user_id'
  AND NOT a.attisdropped;

-- Check constraints
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.activity_feed'::regclass
  AND (conname LIKE '%user_id%' OR pg_get_constraintdef(oid) LIKE '%user_id%');

-- Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'activity_feed'
  AND (indexname LIKE '%user_id%' OR indexdef LIKE '%user_id%');

-- Test query with Steam ID (this will fail if column is UUID)
SELECT * FROM activity_feed 
WHERE user_id = 'steam-76561198001993310' 
LIMIT 1;

