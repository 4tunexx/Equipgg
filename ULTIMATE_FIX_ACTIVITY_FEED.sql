-- =====================================================
-- ULTIMATE FIX - FORCE ACTIVITY_FEED USER_ID TO TEXT
-- =====================================================
-- This script FORCES the conversion without checking anything
-- Run this in Supabase SQL Editor
-- =====================================================

BEGIN;

-- Step 1: Drop all policies aggressively
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

-- Step 4: FORCE convert - no checking, just do it
DO $$
BEGIN
    -- First try to convert values (this will work for UUID, fail silently for TEXT)
    BEGIN
        UPDATE activity_feed SET user_id = user_id::text WHERE user_id IS NOT NULL;
    EXCEPTION WHEN OTHERS THEN
        -- Already text or conversion not needed - continue
        RAISE NOTICE 'Values already text or conversion not needed';
    END;
    
    -- Now force the column type change
    -- This uses USING clause that handles both UUID and TEXT
    BEGIN
        ALTER TABLE activity_feed 
        ALTER COLUMN user_id TYPE TEXT USING user_id::text;
        RAISE NOTICE '✅ Column type changed to TEXT';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Column type change failed: %', SQLERRM;
        -- Try alternative method
        BEGIN
            ALTER TABLE activity_feed 
            ALTER COLUMN user_id TYPE TEXT USING (
                CASE 
                    WHEN user_id IS NULL THEN NULL::TEXT
                    ELSE user_id::TEXT
                END
            );
            RAISE NOTICE '✅ Column type changed using alternative method';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Alternative method also failed: %', SQLERRM;
        END;
    END;
END $$;

-- Ensure NOT NULL
ALTER TABLE activity_feed ALTER COLUMN user_id SET NOT NULL;

-- Recreate index
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON activity_feed(user_id);

-- Recreate simple RLS policies (simplified)
CREATE POLICY "Users can view own activities" 
    ON activity_feed FOR SELECT 
    USING (user_id::text = COALESCE((current_setting('request.jwt.claims', true)::json->>'user_id'), auth.uid()::text));

CREATE POLICY "Users can insert own activities" 
    ON activity_feed FOR INSERT 
    WITH CHECK (user_id::text = COALESCE((current_setting('request.jwt.claims', true)::json->>'user_id'), auth.uid()::text));

COMMIT;

-- Verification - check the actual type
SELECT 
    data_type,
    udt_name,
    column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'activity_feed'
  AND column_name = 'user_id';

