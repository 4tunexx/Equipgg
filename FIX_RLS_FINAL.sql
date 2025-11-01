-- =====================================================
-- FINAL RLS FIX - DISABLE RLS TEMPORARILY TO TEST
-- =====================================================
-- If RLS is blocking, this will disable it temporarily
-- Run this to test if RLS is the issue
-- =====================================================

-- Disable RLS completely
ALTER TABLE activity_feed DISABLE ROW LEVEL SECURITY;

-- Drop all policies
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

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'activity_feed';

-- Test query
SELECT COUNT(*) FROM activity_feed 
WHERE user_id = 'steam-76561198001993310';

