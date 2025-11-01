-- =====================================================
-- ENABLE RLS WITH SIMPLE POLICIES
-- =====================================================
-- After testing with RLS disabled, enable it with simple policies
-- Run this in Supabase SQL Editor
-- =====================================================

BEGIN;

-- Enable RLS
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first
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

-- Create very simple policies that allow everything for now
-- We can restrict later if needed
CREATE POLICY "Allow all SELECT on activity_feed" 
    ON activity_feed FOR SELECT 
    USING (true);

CREATE POLICY "Allow all INSERT on activity_feed" 
    ON activity_feed FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow all UPDATE on activity_feed" 
    ON activity_feed FOR UPDATE 
    USING (true);

CREATE POLICY "Allow all DELETE on activity_feed" 
    ON activity_feed FOR DELETE 
    USING (true);

COMMIT;

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'activity_feed';

-- Verify policies are in place
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'activity_feed';

-- Test query
SELECT COUNT(*) FROM activity_feed 
WHERE user_id = 'steam-76561198001993310';

