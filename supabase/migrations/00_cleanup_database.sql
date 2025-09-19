-- SUPABASE DATABASE CLEANUP SCRIPT
-- Run this FIRST to clean up any existing tables with wrong structure
-- Copy and paste this into your Supabase SQL Editor

-- ⚠️ WARNING: This will delete all existing data!
-- Only run this if you want to start fresh

-- Disable RLS temporarily to avoid constraint issues
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activity_feed DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_activity_feed DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS site_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_sessions DISABLE ROW LEVEL SECURITY;

-- Drop all existing tables (in dependency order)
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS user_inventory CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS bets CASCADE;
DROP TABLE IF EXISTS activity_feed CASCADE;
DROP TABLE IF EXISTS user_activity_feed CASCADE;
DROP TABLE IF EXISTS site_settings CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop any existing views
DROP VIEW IF EXISTS leaderboard CASCADE;

-- Drop existing custom types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS match_status CASCADE;
DROP TYPE IF EXISTS rarity_type CASCADE;
DROP TYPE IF EXISTS rarity_enum CASCADE;
DROP TYPE IF EXISTS match_status_enum CASCADE;

-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS trigger_set_timestamp() CASCADE;

-- Clean up any remaining objects
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename || ' CASCADE';
    END LOOP;
    
    -- Drop all indexes that might be left
    FOR r IN (SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%') 
    LOOP
        EXECUTE 'DROP INDEX IF EXISTS ' || r.indexname || ' CASCADE';
    END LOOP;
END $$;

-- Verify cleanup
SELECT 'Cleanup completed. Ready for fresh migration.' as status;