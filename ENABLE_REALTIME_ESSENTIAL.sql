-- ============================================================================
-- ESSENTIAL REALTIME COMMANDS (Run these 3 commands ONLY)
-- ============================================================================
-- Copy and paste these ONE AT A TIME into Supabase SQL Editor
-- ============================================================================

-- 1. Enable notifications (for toast popups)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 2. Enable chat messages (for live chat)
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- 3. Enable users (for live XP/level updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- ============================================================================
-- VERIFY IT WORKED
-- ============================================================================
-- Run this to check:
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- You should see at least these 3 tables:
-- - notifications
-- - chat_messages
-- - users
-- ============================================================================
