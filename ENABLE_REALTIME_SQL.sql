-- ============================================================================
-- ENABLE SUPABASE REALTIME FOR EQUIPGG
-- ============================================================================
-- Run these commands ONE AT A TIME in your Supabase SQL Editor
-- If you get an error on any, skip it and continue with the next one
-- ============================================================================

-- 1. Enable Realtime for notifications (MOST IMPORTANT!)
-- This enables toast popups when users get notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 2. Enable Realtime for chat messages
-- This enables instant chat message delivery
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- 3. Enable Realtime for user_bets
-- This enables live betting updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_bets;

-- 4. Enable Realtime for bets (if different from user_bets)
ALTER PUBLICATION supabase_realtime ADD TABLE public.bets;

-- 5. Enable Realtime for users
-- This enables live XP/level/rank updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- 6. Enable Realtime for inventory (OPTIONAL - skip if you get an error)
-- This enables instant inventory updates when items are added
-- If you get "relation does not exist" error, just skip this one
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;

-- 7. Enable Realtime for leaderboard
-- This enables live leaderboard ranking updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard;

-- 8. Enable Realtime for matches (optional)
-- This enables live match status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;

-- ============================================================================
-- VERIFY REALTIME IS ENABLED
-- ============================================================================
-- Run this to see which tables have Realtime enabled:
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- ============================================================================
-- DONE!
-- ============================================================================
-- After running these, refresh your app and check the console.
-- You should see: ✅ Subscribed to channel: notifications
-- Instead of: ❌ Error subscribing to channel: notifications
-- ============================================================================
