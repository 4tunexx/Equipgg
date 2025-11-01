-- =====================================================
-- FIX ALL USER_ID COLUMNS FROM UUID TO TEXT
-- =====================================================
-- This comprehensive script fixes ALL tables that reference user_id
-- to support both UUID (email users) and TEXT (Steam users) IDs
--
-- Tables affected:
-- - activity_feed
-- - user_mission_progress
-- - user_inventory
-- - user_achievements
-- - user_badges
--
-- Run this in Supabase SQL Editor
-- =====================================================

BEGIN;

-- =====================================================
-- 1. ACTIVITY_FEED TABLE
-- =====================================================
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all RLS policies on this table
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'activity_feed'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON activity_feed', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
    
    -- Drop foreign key
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'activity_feed_user_id_fkey'
    ) THEN
        ALTER TABLE activity_feed DROP CONSTRAINT activity_feed_user_id_fkey;
    END IF;
    
    -- Drop index
    DROP INDEX IF EXISTS idx_activity_feed_user_id;
    
    -- Convert existing data
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
    
    -- Recreate basic RLS policies (drop first if they exist)
    DROP POLICY IF EXISTS "Users can view own activities" ON activity_feed;
    DROP POLICY IF EXISTS "Users can insert own activities" ON activity_feed;
    
    CREATE POLICY "Users can view own activities" 
        ON activity_feed FOR SELECT 
        USING (user_id::text = COALESCE((current_setting('request.jwt.claims', true)::json->>'user_id')::text, auth.uid()::text));
    
    CREATE POLICY "Users can insert own activities" 
        ON activity_feed FOR INSERT 
        WITH CHECK (user_id::text = COALESCE((current_setting('request.jwt.claims', true)::json->>'user_id')::text, auth.uid()::text));
    
    RAISE NOTICE 'Fixed activity_feed.user_id';
END $$;

-- =====================================================
-- 2. USER_MISSION_PROGRESS TABLE
-- =====================================================
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all RLS policies on this table that depend on user_id
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_mission_progress'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_mission_progress', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
    
    -- Drop foreign key
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_mission_progress_user_id_fkey'
    ) THEN
        ALTER TABLE user_mission_progress DROP CONSTRAINT user_mission_progress_user_id_fkey;
    END IF;
    
    -- Drop index
    DROP INDEX IF EXISTS idx_user_mission_progress_user_id;
    
    -- Convert existing data
    UPDATE user_mission_progress 
    SET user_id = user_id::text 
    WHERE user_id IS NOT NULL;
    
    -- Change column type
    ALTER TABLE user_mission_progress 
    ALTER COLUMN user_id TYPE TEXT USING user_id::text;
    
    -- Ensure NOT NULL
    ALTER TABLE user_mission_progress 
    ALTER COLUMN user_id SET NOT NULL;
    
    -- Recreate index
    CREATE INDEX IF NOT EXISTS idx_user_mission_progress_user_id ON user_mission_progress(user_id);
    
    -- Recreate basic RLS policies (users can only see/insert their own data)
    -- These policies work with TEXT user_id
    -- Note: Service-role client bypasses RLS, so these are mainly for user-scoped queries
    DROP POLICY IF EXISTS "Users can view own mission progress" ON user_mission_progress;
    DROP POLICY IF EXISTS "Users can insert own mission progress" ON user_mission_progress;
    DROP POLICY IF EXISTS "Users can update own mission progress" ON user_mission_progress;
    
    CREATE POLICY "Users can view own mission progress" 
        ON user_mission_progress FOR SELECT 
        USING (user_id::text = COALESCE((current_setting('request.jwt.claims', true)::json->>'user_id')::text, auth.uid()::text));
    
    CREATE POLICY "Users can insert own mission progress" 
        ON user_mission_progress FOR INSERT 
        WITH CHECK (user_id::text = COALESCE((current_setting('request.jwt.claims', true)::json->>'user_id')::text, auth.uid()::text));
    
    CREATE POLICY "Users can update own mission progress" 
        ON user_mission_progress FOR UPDATE 
        USING (user_id::text = COALESCE((current_setting('request.jwt.claims', true)::json->>'user_id')::text, auth.uid()::text));
    
    RAISE NOTICE 'Fixed user_mission_progress.user_id';
END $$;

-- =====================================================
-- 3. USER_INVENTORY TABLE
-- =====================================================
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all RLS policies on this table
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_inventory'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_inventory', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
    
    -- Drop foreign key
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_inventory_user_id_fkey'
    ) THEN
        ALTER TABLE user_inventory DROP CONSTRAINT user_inventory_user_id_fkey;
    END IF;
    
    -- Drop index
    DROP INDEX IF EXISTS idx_user_inventory_user_id;
    
    -- Convert existing data
    UPDATE user_inventory 
    SET user_id = user_id::text 
    WHERE user_id IS NOT NULL;
    
    -- Change column type
    ALTER TABLE user_inventory 
    ALTER COLUMN user_id TYPE TEXT USING user_id::text;
    
    -- Ensure NOT NULL
    ALTER TABLE user_inventory 
    ALTER COLUMN user_id SET NOT NULL;
    
    -- Recreate index
    CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON user_inventory(user_id);
    
    -- Recreate basic RLS policies
    DROP POLICY IF EXISTS "Users can view own inventory" ON user_inventory;
    DROP POLICY IF EXISTS "Users can insert own inventory" ON user_inventory;
    DROP POLICY IF EXISTS "Users can update own inventory" ON user_inventory;
    
    CREATE POLICY "Users can view own inventory" 
        ON user_inventory FOR SELECT 
        USING (user_id::text = COALESCE((current_setting('request.jwt.claims', true)::json->>'user_id')::text, auth.uid()::text));
    
    CREATE POLICY "Users can insert own inventory" 
        ON user_inventory FOR INSERT 
        WITH CHECK (user_id::text = COALESCE((current_setting('request.jwt.claims', true)::json->>'user_id')::text, auth.uid()::text));
    
    CREATE POLICY "Users can update own inventory" 
        ON user_inventory FOR UPDATE 
        USING (user_id::text = COALESCE((current_setting('request.jwt.claims', true)::json->>'user_id')::text, auth.uid()::text));
    
    RAISE NOTICE 'Fixed user_inventory.user_id';
END $$;

-- =====================================================
-- 4. USER_ACHIEVEMENTS TABLE
-- =====================================================
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all RLS policies on this table
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_achievements'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_achievements', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
    
    -- Drop foreign key
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_achievements_user_id_fkey'
    ) THEN
        ALTER TABLE user_achievements DROP CONSTRAINT user_achievements_user_id_fkey;
    END IF;
    
    -- Drop index
    DROP INDEX IF EXISTS idx_user_achievements_user_id;
    
    -- Convert existing data
    UPDATE user_achievements 
    SET user_id = user_id::text 
    WHERE user_id IS NOT NULL;
    
    -- Change column type
    ALTER TABLE user_achievements 
    ALTER COLUMN user_id TYPE TEXT USING user_id::text;
    
    -- Ensure NOT NULL
    ALTER TABLE user_achievements 
    ALTER COLUMN user_id SET NOT NULL;
    
    -- Recreate index
    CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
    
    -- Recreate basic RLS policies
    DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
    DROP POLICY IF EXISTS "Users can insert own achievements" ON user_achievements;
    
    CREATE POLICY "Users can view own achievements" 
        ON user_achievements FOR SELECT 
        USING (user_id::text = COALESCE((current_setting('request.jwt.claims', true)::json->>'user_id')::text, auth.uid()::text));
    
    CREATE POLICY "Users can insert own achievements" 
        ON user_achievements FOR INSERT 
        WITH CHECK (user_id::text = COALESCE((current_setting('request.jwt.claims', true)::json->>'user_id')::text, auth.uid()::text));
    
    RAISE NOTICE 'Fixed user_achievements.user_id';
END $$;

-- =====================================================
-- 5. USER_BADGES TABLE
-- =====================================================
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all RLS policies on this table
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_badges'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_badges', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
    
    -- Drop foreign key
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_badges_user_id_fkey'
    ) THEN
        ALTER TABLE user_badges DROP CONSTRAINT user_badges_user_id_fkey;
    END IF;
    
    -- Drop index (if exists)
    DROP INDEX IF EXISTS idx_user_badges_user_id;
    
    -- Convert existing data
    UPDATE user_badges 
    SET user_id = user_id::text 
    WHERE user_id IS NOT NULL;
    
    -- Change column type
    ALTER TABLE user_badges 
    ALTER COLUMN user_id TYPE TEXT USING user_id::text;
    
    -- Ensure NOT NULL
    ALTER TABLE user_badges 
    ALTER COLUMN user_id SET NOT NULL;
    
    -- Recreate index
    CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
    
    -- Recreate basic RLS policies
    DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;
    DROP POLICY IF EXISTS "Users can insert own badges" ON user_badges;
    
    CREATE POLICY "Users can view own badges" 
        ON user_badges FOR SELECT 
        USING (user_id::text = COALESCE((current_setting('request.jwt.claims', true)::json->>'user_id')::text, auth.uid()::text));
    
    CREATE POLICY "Users can insert own badges" 
        ON user_badges FOR INSERT 
        WITH CHECK (user_id::text = COALESCE((current_setting('request.jwt.claims', true)::json->>'user_id')::text, auth.uid()::text));
    
    RAISE NOTICE 'Fixed user_badges.user_id';
END $$;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES (Run after migration)
-- =====================================================

-- Check all user_id column types
SELECT 
    table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE column_name = 'user_id' 
  AND table_schema = 'public'
ORDER BY table_name;

-- Check all indexes on user_id columns
SELECT 
    tablename,
    indexname, 
    indexdef
FROM pg_indexes
WHERE tablename IN (
    'activity_feed',
    'user_mission_progress',
    'user_inventory',
    'user_achievements',
    'user_badges'
)
AND indexname LIKE '%user_id%'
ORDER BY tablename, indexname;

-- Test queries (uncomment to test)
-- Test Steam user query on activity_feed
-- SELECT * FROM activity_feed 
-- WHERE user_id = 'steam-76561198001993310' 
-- ORDER BY created_at DESC 
-- LIMIT 1;

-- Test Steam user query on user_mission_progress
-- SELECT * FROM user_mission_progress 
-- WHERE user_id = 'steam-76561198001993310';

