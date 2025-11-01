-- =====================================================
-- TEMPORARILY DISABLE RLS TO TEST
-- =====================================================
-- This disables RLS on activity_feed to see if that's the issue
-- Run this in Supabase SQL Editor
-- =====================================================

-- Disable RLS temporarily to test if that's the issue
ALTER TABLE activity_feed DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
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

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'activity_feed';

-- Test query - should work now
SELECT COUNT(*) FROM activity_feed 
WHERE user_id = 'steam-76561198001993310';

