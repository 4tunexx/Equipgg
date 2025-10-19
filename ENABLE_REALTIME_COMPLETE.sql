-- ============================================================================
-- ENABLE REALTIME FOR ALL RELEVANT TABLES (Based on your actual schema)
-- ============================================================================
-- Run these ONE AT A TIME in Supabase SQL Editor
-- Skip any that say "already member" - that means it's already enabled!
-- ============================================================================

-- ALREADY ENABLED (skip these):
-- ✅ notifications
-- ✅ chat_messages  
-- ✅ users

-- ============================================================================
-- CRITICAL TABLES (Enable these for core functionality)
-- ============================================================================

-- Betting & Matches
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_bets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_votes;

-- Inventory & Items
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.items;

-- Achievements & Missions
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_achievements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.achievements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_missions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.missions;

-- Badges & Ranks
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_badges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.badges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ranks;

-- Perks
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_perks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.perks;

-- ============================================================================
-- OPTIONAL TABLES (Enable if you want real-time updates for these)
-- ============================================================================

-- Chat & Community
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channel_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_topics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_posts;

-- Crates & Shop
ALTER PUBLICATION supabase_realtime ADD TABLE public.crate_openings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_items;

-- Trading
ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.steam_trade_offers;

-- Games
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.coinflip_lobbies;

-- Transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gem_transactions;

-- Support & Admin
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_logs;

-- Polls & Community
ALTER PUBLICATION supabase_realtime ADD TABLE public.polls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;

-- ============================================================================
-- VERIFY WHAT'S ENABLED
-- ============================================================================
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- ============================================================================
-- PRIORITY ORDER
-- ============================================================================
-- If you want to enable them gradually, do them in this order:
-- 1. matches, user_bets (for live betting)
-- 2. user_inventory, inventory_items (for item updates)
-- 3. user_achievements, user_missions (for progress tracking)
-- 4. user_badges, ranks (for rank/badge updates)
-- 5. Everything else (optional)
-- ============================================================================
