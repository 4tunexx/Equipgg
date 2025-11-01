-- =====================================================
-- CHECK RLS POLICIES ON ACTIVITY_FEED
-- =====================================================
-- Run this to see what RLS policies exist and if they're blocking queries
-- =====================================================

-- Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'activity_feed';

-- Check all policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd AS command_type,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'activity_feed';

-- Test query that should work (simulating what PostgREST does)
-- This will show if RLS is blocking
SET ROLE authenticated;
SELECT id, user_id, action, item_id, icon, xp, created_at
FROM activity_feed
WHERE user_id = 'steam-76561198001993310'
ORDER BY created_at DESC
LIMIT 10;

RESET ROLE;

