-- =====================================================
-- FINAL FIX FOR ACTIVITY_FEED USER_ID
-- =====================================================
-- This script ensures activity_feed.user_id is TEXT and works with Steam IDs
-- Run this in Supabase SQL Editor
-- =====================================================

BEGIN;

-- Step 1: Check current column type
DO $$
DECLARE
    current_type TEXT;
    policy_record RECORD;
BEGIN
    SELECT data_type INTO current_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'activity_feed'
      AND column_name = 'user_id';
    
    RAISE NOTICE 'Current user_id column type: %', current_type;
    
    -- If it's still UUID, we need to change it
    IF current_type = 'uuid' OR current_type = 'USER-DEFINED' THEN
        RAISE NOTICE 'Column is still UUID, converting to TEXT...';
        
        -- Drop all policies first
        FOR policy_record IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE tablename = 'activity_feed'
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON activity_feed', policy_record.policyname);
            RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
        END LOOP;
        
        -- Drop foreign key if exists
        ALTER TABLE activity_feed DROP CONSTRAINT IF EXISTS activity_feed_user_id_fkey;
        
        -- Drop index
        DROP INDEX IF EXISTS idx_activity_feed_user_id;
        
        -- Convert existing UUID values to TEXT
        UPDATE activity_feed 
        SET user_id = user_id::text 
        WHERE user_id IS NOT NULL;
        
        -- Change column type
        ALTER TABLE activity_feed 
        ALTER COLUMN user_id TYPE TEXT USING user_id::text;
        
        -- Ensure NOT NULL
        ALTER TABLE activity_feed 
        ALTER COLUMN user_id SET NOT NULL;
        
        -- Recreate index
        CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON activity_feed(user_id);
        
        RAISE NOTICE 'Successfully converted user_id to TEXT';
    ELSE
        RAISE NOTICE 'Column is already TEXT, no changes needed';
    END IF;
END $$;

-- Step 2: Recreate basic RLS policies (drop first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own activities" ON activity_feed;
DROP POLICY IF EXISTS "Users can insert own activities" ON activity_feed;

CREATE POLICY "Users can view own activities" 
    ON activity_feed FOR SELECT 
    USING (user_id::text = COALESCE((current_setting('request.jwt.claims', true)::json->>'user_id')::text, auth.uid()::text));

CREATE POLICY "Users can insert own activities" 
    ON activity_feed FOR INSERT 
    WITH CHECK (user_id::text = COALESCE((current_setting('request.jwt.claims', true)::json->>'user_id')::text, auth.uid()::text));

-- Step 3: Verify the fix
DO $$
DECLARE
    new_type TEXT;
BEGIN
    SELECT data_type INTO new_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'activity_feed'
      AND column_name = 'user_id';
    
    RAISE NOTICE '✅ Final user_id column type: %', new_type;
    
    -- Test that we can query with Steam ID
    IF EXISTS (
        SELECT 1 FROM activity_feed 
        WHERE user_id::text = 'steam-76561198001993310' 
        LIMIT 1
    ) THEN
        RAISE NOTICE '✅ Test query with Steam ID succeeded!';
    ELSE
        RAISE NOTICE '⚠️  Test query returned no results (might be empty, but query works)';
    END IF;
END $$;

COMMIT;

-- Verification query (run after migration)
-- SELECT data_type FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'activity_feed' AND column_name = 'user_id';

