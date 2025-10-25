-- ================================================
-- COMPLETE SUPABASE DATABASE AUDIT
-- Run this in Supabase SQL Editor
-- ================================================

-- ================================================
-- SECTION 1: LIST ALL TABLES
-- ================================================
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename;

-- ================================================
-- SECTION 2: CHECK MISSIONS TABLE
-- ================================================
SELECT 
    COUNT(*) as total_missions,
    COUNT(CASE WHEN mission_type = 'daily' THEN 1 END) as daily_missions,
    COUNT(CASE WHEN mission_type = 'main' THEN 1 END) as main_missions,
    COUNT(CASE WHEN mission_type = 'weekly' THEN 1 END) as weekly_missions,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_missions,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_missions
FROM missions;

-- Show all missions with their details
SELECT 
    id,
    name,
    mission_type,
    tier,
    requirement_type,
    requirement_value,
    xp_reward,
    coin_reward,
    is_active,
    is_repeatable
FROM missions
ORDER BY mission_type, tier, id;

-- ================================================
-- SECTION 3: CHECK ITEMS TABLE
-- ================================================
SELECT 
    COUNT(*) as total_items,
    COUNT(CASE WHEN is_equipable = true THEN 1 END) as equipable_items,
    COUNT(CASE WHEN is_tradeable = true THEN 1 END) as tradeable_items,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_items,
    COUNT(CASE WHEN featured = true THEN 1 END) as featured_items
FROM items;

-- Show item breakdown by type and rarity
SELECT 
    type,
    rarity,
    COUNT(*) as count,
    AVG(coin_price) as avg_price,
    MIN(coin_price) as min_price,
    MAX(coin_price) as max_price
FROM items
WHERE is_active = true
GROUP BY type, rarity
ORDER BY type, rarity;

-- ================================================
-- SECTION 4: CHECK BADGES TABLE
-- ================================================
SELECT 
    COUNT(*) as total_badges
FROM badges;

-- Show badges (column names may vary)
SELECT *
FROM badges
ORDER BY rarity, name
LIMIT 10;

-- ================================================
-- SECTION 5: CHECK ACHIEVEMENTS TABLE
-- ================================================
SELECT 
    COUNT(*) as total_achievements
FROM achievements;

-- Show achievements (column names may vary)
SELECT *
FROM achievements
ORDER BY name
LIMIT 10;

-- ================================================
-- SECTION 6: CHECK RANKS TABLE
-- ================================================
SELECT 
    COUNT(*) as total_ranks
FROM ranks;

-- Show ranks (column names may vary)
SELECT *
FROM ranks
LIMIT 10;

-- ================================================
-- SECTION 7: CHECK CHAT MESSAGES TABLE
-- ================================================
SELECT 
    COUNT(*) as total_messages
FROM chat_messages;

-- Show recent chat messages (column names may vary)
SELECT *
FROM chat_messages
LIMIT 10;

-- ================================================
-- SECTION 8: CHECK USER ACTIVITIES TABLE
-- ================================================
SELECT 
    COUNT(*) as total_activities
FROM user_activities;

SELECT 
    activity_type,
    COUNT(*) as count
FROM user_activities
GROUP BY activity_type
ORDER BY count DESC;

-- ================================================
-- SECTION 9: CHECK USER INVENTORY
-- ================================================
SELECT 
    COUNT(*) as total_inventory_items,
    COUNT(CASE WHEN equipped = true THEN 1 END) as equipped_items,
    COUNT(DISTINCT user_id) as users_with_items
FROM user_inventory;

-- Check for items with is_equipable but can't be equipped
SELECT 
    i.id,
    i.name,
    i.type,
    i.is_equipable,
    COUNT(ui.id) as times_in_inventory,
    COUNT(CASE WHEN ui.equipped = true THEN 1 END) as times_equipped
FROM items i
LEFT JOIN user_inventory ui ON ui.item_id = i.id
WHERE i.is_equipable = true
GROUP BY i.id, i.name, i.type, i.is_equipable
ORDER BY times_in_inventory DESC;

-- ================================================
-- SECTION 10: CHECK MISSION PROGRESS
-- ================================================
SELECT 
    COUNT(*) as total_progress_records,
    COUNT(CASE WHEN completed = true THEN 1 END) as completed_missions,
    COUNT(DISTINCT user_id) as users_with_progress,
    COUNT(DISTINCT mission_id) as missions_with_progress
FROM user_mission_progress;

-- ================================================
-- SECTION 11: CHECK FOR ORPHANED DATA
-- ================================================

-- Check for user_inventory items pointing to non-existent items
SELECT 
    'Orphaned Inventory Items' as issue,
    COUNT(*) as count
FROM user_inventory ui
WHERE NOT EXISTS (
    SELECT 1 FROM items i WHERE i.id = ui.item_id
);

-- Check for mission progress pointing to non-existent missions
SELECT 
    'Orphaned Mission Progress' as issue,
    COUNT(*) as count
FROM user_mission_progress ump
WHERE NOT EXISTS (
    SELECT 1 FROM missions m WHERE m.id = ump.mission_id
);

-- ================================================
-- SECTION 12: CHECK TABLE STRUCTURES
-- ================================================

-- Check missions table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'missions'
ORDER BY ordinal_position;

-- Check items table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'items'
ORDER BY ordinal_position;

-- Check user_inventory structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_inventory'
ORDER BY ordinal_position;

-- ================================================
-- SECTION 13: CHECK INDEXES
-- ================================================
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ================================================
-- SECTION 14: SAMPLE DATA CHECK
-- ================================================

-- Show first 5 missions
SELECT * FROM missions LIMIT 5;

-- Show first 5 items
SELECT * FROM items LIMIT 5;

-- Show first 5 chat messages
SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 5;

-- Show first 5 user activities
SELECT * FROM user_activities ORDER BY created_at DESC LIMIT 5;

-- ================================================
-- SECTION 15: DATA QUALITY CHECKS
-- ================================================

-- Check for NULL requirement_type in missions (CRITICAL!)
SELECT 
    'Missions with NULL requirement_type' as issue,
    COUNT(*) as count
FROM missions
WHERE requirement_type IS NULL OR requirement_type = '';

-- Check for items with NULL or 0 prices
SELECT 
    'Items with zero or NULL coin_price' as issue,
    COUNT(*) as count
FROM items
WHERE coin_price IS NULL OR coin_price = 0;

-- Check for equipped items without a slot
SELECT 
    'Equipped items without slot' as issue,
    COUNT(*) as count
FROM user_inventory
WHERE equipped = true AND (slot IS NULL OR slot = '');

SELECT '✅ DATABASE AUDIT COMPLETE!' as status;
