-- =====================================================
-- CHECK AND FIX ACTIVITY_FEED USER_ID COLUMN TYPE
-- =====================================================
-- Run this in Supabase SQL Editor
-- This script checks the actual PostgreSQL column type and fixes it if needed
-- =====================================================

BEGIN;

-- Step 1: Check current column type in PostgreSQL (not inferred from data)
DO $$
DECLARE
    current_type TEXT;
    current_udt TEXT;
    policy_record RECORD;
BEGIN
    -- Get the actual PostgreSQL data type
    SELECT data_type, udt_name 
    INTO current_type, current_udt
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'activity_feed'
      AND column_name = 'user_id';
    
    RAISE NOTICE 'Current user_id data_type: %, udt_name: %', current_type, current_udt;
    
    -- If it's uuid or uuid type, we need to convert it
    IF current_type = 'uuid' OR current_udt = 'uuid' THEN
        RAISE NOTICE '⚠️  Column is UUID - converting to TEXT...';
        
        -- 1. Drop all RLS policies
        FOR policy_record IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE tablename = 'activity_feed'
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON activity_feed', policy_record.policyname);
            RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
        END LOOP;
        
        -- 2. Drop foreign key constraint if exists
        IF EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'activity_feed_user_id_fkey'
        ) THEN
            ALTER TABLE activity_feed DROP CONSTRAINT activity_feed_user_id_fkey;
            RAISE NOTICE 'Dropped foreign key constraint';
        END IF;
        
        -- 3. Drop index
        DROP INDEX IF EXISTS idx_activity_feed_user_id;
        RAISE NOTICE 'Dropped index';
        
        -- 4. Convert existing UUID values to TEXT (cast to text)
        UPDATE activity_feed 
        SET user_id = user_id::text 
        WHERE user_id IS NOT NULL;
        RAISE NOTICE 'Converted existing UUID values to TEXT';
        
        -- 5. Change column type from UUID to TEXT
        ALTER TABLE activity_feed 
        ALTER COLUMN user_id TYPE TEXT USING user_id::text;
        RAISE NOTICE 'Changed column type to TEXT';
        
        -- 6. Ensure NOT NULL constraint
        ALTER TABLE activity_feed 
        ALTER COLUMN user_id SET NOT NULL;
        RAISE NOTICE 'Ensured NOT NULL constraint';
        
        -- 7. Recreate index
        CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON activity_feed(user_id);
        RAISE NOTICE 'Recreated index';
        
        -- 8. Recreate basic RLS policies
        DROP POLICY IF EXISTS "Users can view own activities" ON activity_feed;
        DROP POLICY IF EXISTS "Users can insert own activities" ON activity_feed;
        
        CREATE POLICY "Users can view own activities" 
            ON activity_feed FOR SELECT 
            USING (user_id::text = COALESCE((current_setting('request.jwt.claims', true)::json->>'user_id')::text, auth.uid()::text));
        
        CREATE POLICY "Users can insert own activities" 
            ON activity_feed FOR INSERT 
            WITH CHECK (user_id::text = COALESCE((current_setting('request.jwt.claims', true)::json->>'user_id')::text, auth.uid()::text));
        
        RAISE NOTICE 'Recreated RLS policies';
        
        RAISE NOTICE '✅ Successfully converted user_id from UUID to TEXT';
    ELSE
        RAISE NOTICE '✅ Column is already TEXT (data_type: %, udt_name: %), no changes needed', current_type, current_udt;
    END IF;
END $$;

-- Step 2: Verify the fix
DO $$
DECLARE
    final_type TEXT;
    final_udt TEXT;
    test_result INTEGER;
BEGIN
    -- Check final type
    SELECT data_type, udt_name 
    INTO final_type, final_udt
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'activity_feed'
      AND column_name = 'user_id';
    
    RAISE NOTICE '✅ Final user_id type: data_type=%, udt_name=%', final_type, final_udt;
    
    -- Test query with Steam ID
    BEGIN
        SELECT COUNT(*) INTO test_result
        FROM activity_feed 
        WHERE user_id = 'steam-76561198001993310';
        
        RAISE NOTICE '✅ Test query with Steam ID succeeded! (found % rows)', test_result;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Test query failed: %', SQLERRM;
    END;
END $$;

COMMIT;

-- Verification query (run separately if needed)
-- SELECT data_type, udt_name FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'activity_feed' AND column_name = 'user_id';

