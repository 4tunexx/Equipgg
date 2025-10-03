-- EQUIPGG DATABASE SCHEMA CHECKER
-- This script checks what tables and columns already exist in your Supabase database

-- ==============================================
-- 1. CHECK ALL EXISTING TABLES
-- ==============================================

DO $$
DECLARE
    table_list TEXT := '';
    table_record RECORD;
    table_count INT := 0;
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE '📊 CHECKING EXISTING TABLES IN YOUR DATABASE';
    RAISE NOTICE '==============================================';
    
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
    LOOP
        table_count := table_count + 1;
        table_list := table_list || E'\n   • ' || table_record.table_name;
    END LOOP;
    
    RAISE NOTICE 'Found % tables in your database:', table_count;
    RAISE NOTICE '%', table_list;
    RAISE NOTICE '';
END $$;

-- ==============================================
-- 2. CHECK SPECIFIC TABLES YOUR APP EXPECTS
-- ==============================================

DO $$
DECLARE
    expected_tables TEXT[] := ARRAY[
        'users', 'items', 'achievements', 'missions', 'ranks', 'badges', 'perks',
        'user_achievements', 'user_inventory', 'user_stats', 'user_mission_progress',
        'user_ranks', 'user_badges', 'user_perks', 'notifications', 'flash_sales',
        'matches', 'user_bets', 'coinflip_games', 'crash_games', 'jackpot_entries',
        'roulette_games', 'case_openings', 'chat_messages', 'lobbies', 'user_sessions',
        'user_transactions', 'withdrawal_requests', 'user_referrals'
    ];
    current_table TEXT;
    exists_count INT;
    missing_tables TEXT := '';
    existing_tables TEXT := '';
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE '🔍 CHECKING EXPECTED TABLES FOR YOUR APP';
    RAISE NOTICE '==============================================';
    
    FOREACH current_table IN ARRAY expected_tables
    LOOP
        SELECT COUNT(*) INTO exists_count
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = current_table;
        
        IF exists_count > 0 THEN
            existing_tables := existing_tables || E'\n   ✅ ' || current_table;
        ELSE
            missing_tables := missing_tables || E'\n   ❌ ' || current_table;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'EXISTING TABLES (✅):';
    RAISE NOTICE '%', existing_tables;
    RAISE NOTICE '';
    RAISE NOTICE 'MISSING TABLES (❌):';
    RAISE NOTICE '%', missing_tables;
    RAISE NOTICE '';
END $$;

-- ==============================================
-- 3. CHECK CRITICAL COLUMNS IN KEY TABLES
-- ==============================================

DO $$
DECLARE
    column_check RECORD;
    missing_columns TEXT := '';
    existing_columns TEXT := '';
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE '📋 CHECKING CRITICAL COLUMNS';
    RAISE NOTICE '==============================================';
    
    -- Check for items.featured column
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'items') THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'items' AND column_name = 'featured'
        ) THEN
            existing_columns := existing_columns || E'\n   ✅ items.featured';
        ELSE
            missing_columns := missing_columns || E'\n   ❌ items.featured';
        END IF;
    ELSE
        missing_columns := missing_columns || E'\n   ❌ items table (entire table missing)';
    END IF;
    
    -- Check for chat_messages.lobby column
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'chat_messages' AND column_name = 'lobby'
        ) THEN
            existing_columns := existing_columns || E'\n   ✅ chat_messages.lobby';
        ELSE
            missing_columns := missing_columns || E'\n   ❌ chat_messages.lobby';
        END IF;
    ELSE
        missing_columns := missing_columns || E'\n   ❌ chat_messages table (entire table missing)';
    END IF;
    
    -- Check for user_achievements.progress column
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_achievements') THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_achievements' AND column_name = 'progress'
        ) THEN
            existing_columns := existing_columns || E'\n   ✅ user_achievements.progress';
        ELSE
            missing_columns := missing_columns || E'\n   ❌ user_achievements.progress';
        END IF;
    ELSE
        missing_columns := missing_columns || E'\n   ❌ user_achievements table (entire table missing)';
    END IF;
    
    RAISE NOTICE 'EXISTING CRITICAL COLUMNS (✅):';
    RAISE NOTICE '%', existing_columns;
    RAISE NOTICE '';
    RAISE NOTICE 'MISSING CRITICAL COLUMNS (❌):';
    RAISE NOTICE '%', missing_columns;
    RAISE NOTICE '';
END $$;

-- ==============================================
-- 4. CHECK DATA IN EXISTING TABLES
-- ==============================================

DO $$
DECLARE
    current_tbl TEXT;
    row_count INT;
    data_summary TEXT := '';
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE '📊 CHECKING DATA IN EXISTING TABLES';
    RAISE NOTICE '==============================================';
    
    -- Check key tables for data
    FOREACH current_tbl IN ARRAY ARRAY['users', 'items', 'achievements', 'missions', 'ranks', 'badges', 'user_achievements', 'user_inventory', 'notifications']
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = current_tbl) THEN
            EXECUTE 'SELECT COUNT(*) FROM ' || current_tbl INTO row_count;
            data_summary := data_summary || E'\n   • ' || current_tbl || ': ' || row_count || ' records';
        END IF;
    END LOOP;
    
    RAISE NOTICE 'DATA COUNTS:';
    RAISE NOTICE '%', data_summary;
    RAISE NOTICE '';
END $$;

-- ==============================================
-- 5. FINAL RECOMMENDATIONS
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE '💡 RECOMMENDATIONS';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Based on the analysis above:';
    RAISE NOTICE '';
    RAISE NOTICE '1. ✅ = Already exists (no action needed)';
    RAISE NOTICE '2. ❌ = Missing (needs to be created)';
    RAISE NOTICE '';
    RAISE NOTICE 'Next step: Create only the missing tables/columns';
    RAISE NOTICE 'to avoid conflicts with existing data.';
    RAISE NOTICE '==============================================';
END $$;