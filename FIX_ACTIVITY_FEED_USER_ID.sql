-- =====================================================
-- FIX ACTIVITY_FEED USER_ID TYPE MISMATCH
-- =====================================================
-- This script changes activity_feed.user_id from UUID to TEXT
-- to support Steam users who have TEXT IDs (steam-...)
-- 
-- Run this in Supabase SQL Editor
-- =====================================================

BEGIN;

-- Step 1: Drop the foreign key constraint (if it exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'activity_feed_user_id_fkey'
    ) THEN
        ALTER TABLE activity_feed DROP CONSTRAINT activity_feed_user_id_fkey;
        RAISE NOTICE 'Dropped foreign key constraint: activity_feed_user_id_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint does not exist, skipping...';
    END IF;
END $$;

-- Step 2: Drop the index (will be recreated after column type change)
DROP INDEX IF EXISTS idx_activity_feed_user_id;

-- Step 3: Convert existing UUID values to TEXT (cast to text)
-- This preserves existing data if there are any UUID entries
UPDATE activity_feed 
SET user_id = user_id::text 
WHERE user_id IS NOT NULL;

-- Step 4: Change column type from UUID to TEXT
ALTER TABLE activity_feed 
ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- Step 5: Make sure NOT NULL constraint is still in place
ALTER TABLE activity_feed 
ALTER COLUMN user_id SET NOT NULL;

-- Step 6: Recreate the index for better query performance
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON activity_feed(user_id);

-- Step 7: Recreate index on created_at if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at);

-- Note: We do NOT recreate the foreign key constraint because:
-- 1. auth.users(id) is UUID but users table has TEXT IDs for Steam users
-- 2. We'll handle referential integrity at the application level
-- 3. This allows flexibility for both UUID and TEXT user IDs

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES (Run after migration)
-- =====================================================

-- Check column type
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'activity_feed' 
  AND column_name = 'user_id';

-- Check indexes
SELECT 
    indexname, 
    indexdef
FROM pg_indexes
WHERE tablename = 'activity_feed';

-- Test query with Steam user ID (should work now)
-- SELECT * FROM activity_feed 
-- WHERE user_id = 'steam-76561198001993310' 
-- ORDER BY created_at DESC 
-- LIMIT 1;

