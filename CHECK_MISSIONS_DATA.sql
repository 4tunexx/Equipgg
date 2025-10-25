-- ================================================
-- CHECK IF MISSIONS HAVE requirement_type DATA
-- ================================================

-- Count missions with NULL requirement_type
SELECT 
    'Total missions' as metric,
    COUNT(*) as count
FROM missions
UNION ALL
SELECT 
    'Missions with requirement_type SET' as metric,
    COUNT(*) as count
FROM missions
WHERE requirement_type IS NOT NULL AND requirement_type != ''
UNION ALL
SELECT 
    'Missions with NULL requirement_type' as metric,
    COUNT(*) as count
FROM missions
WHERE requirement_type IS NULL OR requirement_type = '';

-- Show all missions and their requirement_type
SELECT 
    id,
    name,
    mission_type,
    tier,
    requirement_type,
    requirement_value,
    xp_reward,
    coin_reward,
    is_active
FROM missions
ORDER BY mission_type, tier, id;

-- Group by requirement_type to see what types exist
SELECT 
    requirement_type,
    COUNT(*) as mission_count,
    STRING_AGG(name, ', ') as mission_names
FROM missions
GROUP BY requirement_type
ORDER BY mission_count DESC;
