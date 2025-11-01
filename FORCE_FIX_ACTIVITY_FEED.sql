-- =====================================================
-- FORCE FIX ACTIVITY_FEED USER_ID - SIMPLE AND DIRECT
-- =====================================================
-- This script directly fixes activity_feed.user_id without checking
-- Run this in Supabase SQL Editor
-- =====================================================

BEGIN;

-- Step 1: Drop ALL policies (don't loop, just drop what we know exists)
DROP POLICY IF EXISTS "Users can view own activities" ON activity_feed;
DROP POLICY IF EXISTS "Users can insert own activities" ON activity_feed;
DROP POLICY IF EXISTS "Users can update own activities" ON activity_feed;
DROP POLICY IF EXISTS "Users can delete own activities" ON activity_feed;

-- Drop any policies that might exist with different names
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
        RAISE NOTICE 'Dropped policy: %', pol_name;
    END LOOP;
END $$;

-- Step 2: Drop foreign key constraint
ALTER TABLE activity_feed DROP CONSTRAINT IF EXISTS activity_feed_user_id_fkey CASCADE;

-- Step 3: Drop index
DROP INDEX IF EXISTS idx_activity_feed_user_id CASCADE;

-- Step 4: FORCE convert column type - check both data_type and udt_name
DO $$
DECLARE
    col_type TEXT;
    udt_type TEXT;
BEGIN
    -- Get actual column type from information_schema
    SELECT data_type, udt_name INTO col_type, udt_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'activity_feed'
      AND column_name = 'user_id';
    
    RAISE NOTICE 'Current column type: data_type=%, udt_name=%', col_type, udt_type;
    
    -- Check both data_type and udt_name - UUID shows as USER-DEFINED in data_type but uuid in udt_name
    IF col_type = 'uuid' OR udt_type = 'uuid' OR col_type = 'USER-DEFINED' THEN
        RAISE NOTICE '⚠️  Column is UUID - FORCING conversion to TEXT...';
        
        -- Convert existing values
        EXECUTE 'UPDATE activity_feed SET user_id = user_id::text WHERE user_id IS NOT NULL';
        
        -- Change column type - force it using EXECUTE
        EXECUTE 'ALTER TABLE activity_feed ALTER COLUMN user_id TYPE TEXT USING user_id::text';
        
        RAISE NOTICE '✅ Converted to TEXT';
    ELSE
        RAISE NOTICE 'Column type is: % (udt: %), assuming TEXT but forcing conversion anyway...', col_type, udt_type;
        -- Force it anyway if we're not sure
        BEGIN
            EXECUTE 'ALTER TABLE activity_feed ALTER COLUMN user_id TYPE TEXT USING user_id::text';
            RAISE NOTICE '✅ Forced to TEXT';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Already TEXT or conversion not needed: %', SQLERRM;
        END;
    END IF;
    
    -- Ensure NOT NULL
    EXECUTE 'ALTER TABLE activity_feed ALTER COLUMN user_id SET NOT NULL';
    
    RAISE NOTICE '✅ Column fixed';
END $$;

-- Step 5: Recreate index
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON activity_feed(user_id);

-- Step 6: Recreate simple RLS policies
CREATE POLICY "Users can view own activities" 
    ON activity_feed FOR SELECT 
    USING (user_id = COALESCE((current_setting('request.jwt.claims', true)::json->>'user_id'), auth.uid()::text));

CREATE POLICY "Users can insert own activities" 
    ON activity_feed FOR INSERT 
    WITH CHECK (user_id = COALESCE((current_setting('request.jwt.claims', true)::json->>'user_id'), auth.uid()::text));

-- Step 7: Verify
DO $$
DECLARE
    final_type TEXT;
    test_count INTEGER;
BEGIN
    -- Check final type
    SELECT data_type INTO final_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'activity_feed'
      AND column_name = 'user_id';
    
    RAISE NOTICE '✅ Final column type: %', final_type;
    
    -- Test query
    BEGIN
        EXECUTE 'SELECT COUNT(*) FROM activity_feed WHERE user_id = $1' 
        INTO test_count 
        USING 'steam-76561198001993310';
        
        RAISE NOTICE '✅ Test query successful! Found % rows', test_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Test query failed: %', SQLERRM;
    END;
END $$;

COMMIT;

-- Final verification (run separately)
-- SELECT data_type, udt_name FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'activity_feed' AND column_name = 'user_id';

