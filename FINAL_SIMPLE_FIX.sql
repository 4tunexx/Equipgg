-- =====================================================
-- FINAL SIMPLE FIX - ACTIVITY_FEED USER_ID
-- =====================================================
-- This is the simplest, most direct fix
-- Run this in Supabase SQL Editor
-- =====================================================

BEGIN;

-- Step 1: Drop all policies
DO $$
DECLARE
    pol_name TEXT;
BEGIN
    FOR pol_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'activity_feed'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON activity_feed', pol_name);
    END LOOP;
END $$;

-- Step 2: Drop foreign key
ALTER TABLE activity_feed DROP CONSTRAINT IF EXISTS activity_feed_user_id_fkey CASCADE;

-- Step 3: Drop index
DROP INDEX IF EXISTS idx_activity_feed_user_id CASCADE;

-- Step 4: FORCE convert column type - SIMPLE DIRECT METHOD
ALTER TABLE activity_feed 
ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- Step 5: Ensure NOT NULL
ALTER TABLE activity_feed ALTER COLUMN user_id SET NOT NULL;

-- Step 6: Recreate index
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON activity_feed(user_id);

-- Step 7: Recreate RLS policies
CREATE POLICY "Users can view own activities" 
    ON activity_feed FOR SELECT 
    USING (user_id = COALESCE((current_setting('request.jwt.claims', true)::json->>'user_id'), auth.uid()::text));

CREATE POLICY "Users can insert own activities" 
    ON activity_feed FOR INSERT 
    WITH CHECK (user_id = COALESCE((current_setting('request.jwt.claims', true)::json->>'user_id'), auth.uid()::text));

COMMIT;

-- Verify it worked
SELECT 
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'activity_feed'
  AND column_name = 'user_id';

-- Test query
SELECT COUNT(*) FROM activity_feed 
WHERE user_id = 'steam-76561198001993310';

