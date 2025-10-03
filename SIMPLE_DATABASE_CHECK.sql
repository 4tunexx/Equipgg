-- SIMPLE DATABASE CHECK - Returns actual result sets
-- Run each query separately to see what you have

-- 1. CHECK ALL EXISTING TABLES
SELECT 
    'EXISTING_TABLES' as check_type,
    table_name as name,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. CHECK WHICH EXPECTED TABLES ARE MISSING
WITH expected_tables AS (
    SELECT unnest(ARRAY[
        'users', 'items', 'achievements', 'missions', 'ranks', 'badges', 'perks',
        'user_achievements', 'user_inventory', 'user_stats', 'user_mission_progress',
        'user_ranks', 'user_badges', 'user_perks', 'notifications', 'flash_sales',
        'matches', 'user_bets', 'coinflip_games', 'crash_games', 'jackpot_entries',
        'roulette_games', 'case_openings', 'chat_messages', 'lobbies', 'user_sessions',
        'user_transactions', 'withdrawal_requests', 'user_referrals'
    ]) as expected_table
),
existing_tables AS (
    SELECT table_name
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
)
SELECT 
    'TABLE_STATUS' as check_type,
    et.expected_table as name,
    CASE 
        WHEN ext.table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM expected_tables et
LEFT JOIN existing_tables ext ON et.expected_table = ext.table_name
ORDER BY status, et.expected_table;

-- 3. CHECK DATA COUNTS IN EXISTING KEY TABLES
SELECT 
    'DATA_COUNT' as check_type,
    'users' as table_name,
    COUNT(*) as record_count
FROM users
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public')

UNION ALL

SELECT 
    'DATA_COUNT' as check_type,
    'items' as table_name,
    COUNT(*) as record_count
FROM items
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'items' AND table_schema = 'public')

UNION ALL

SELECT 
    'DATA_COUNT' as check_type,
    'achievements' as table_name,
    COUNT(*) as record_count
FROM achievements
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'achievements' AND table_schema = 'public')

UNION ALL

SELECT 
    'DATA_COUNT' as check_type,
    'missions' as table_name,
    COUNT(*) as record_count
FROM missions
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'missions' AND table_schema = 'public')

ORDER BY table_name;