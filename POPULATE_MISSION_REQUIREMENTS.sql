-- ================================================
-- POPULATE MISSION requirement_type VALUES
-- Run this if missions have NULL requirement_type
-- ================================================

-- Update missions based on their names/descriptions
-- This maps common mission patterns to their requirement types

-- Login missions
UPDATE missions
SET requirement_type = 'login'
WHERE requirement_type IS NULL
AND (
    LOWER(name) LIKE '%login%' OR
    LOWER(name) LIKE '%log in%' OR
    LOWER(description) LIKE '%login%' OR
    LOWER(description) LIKE '%log in%'
);

-- Bet placement missions
UPDATE missions
SET requirement_type = 'bet_placed'
WHERE requirement_type IS NULL
AND (
    LOWER(name) LIKE '%place%bet%' OR
    LOWER(name) LIKE '%make%bet%' OR
    LOWER(description) LIKE '%place%bet%' OR
    LOWER(description) LIKE '%make%bet%'
);

-- Bet winning missions
UPDATE missions
SET requirement_type = 'bet_won'
WHERE requirement_type IS NULL
AND (
    LOWER(name) LIKE '%win%bet%' OR
    LOWER(name) LIKE '%winning%' OR
    LOWER(description) LIKE '%win%bet%' OR
    LOWER(description) LIKE '%winning%'
);

-- Crate opening missions
UPDATE missions
SET requirement_type = 'crate_opened'
WHERE requirement_type IS NULL
AND (
    LOWER(name) LIKE '%crate%' OR
    LOWER(name) LIKE '%case%' OR
    LOWER(name) LIKE '%box%' OR
    LOWER(description) LIKE '%open%crate%' OR
    LOWER(description) LIKE '%open%case%'
);

-- Item buying missions
UPDATE missions
SET requirement_type = 'item_bought'
WHERE requirement_type IS NULL
AND (
    LOWER(name) LIKE '%buy%' OR
    LOWER(name) LIKE '%purchase%' OR
    LOWER(description) LIKE '%buy%item%' OR
    LOWER(description) LIKE '%purchase%item%'
);

-- Item selling missions
UPDATE missions
SET requirement_type = 'item_sold'
WHERE requirement_type IS NULL
AND (
    LOWER(name) LIKE '%sell%' OR
    LOWER(description) LIKE '%sell%item%'
);

-- Trade missions
UPDATE missions
SET requirement_type = 'trade_completed'
WHERE requirement_type IS NULL
AND (
    LOWER(name) LIKE '%trade%' OR
    LOWER(description) LIKE '%complete%trade%' OR
    LOWER(description) LIKE '%finish%trade%'
);

-- Show updated missions
SELECT 
    id,
    name,
    mission_type,
    requirement_type,
    requirement_value,
    is_active
FROM missions
ORDER BY mission_type, tier, id;

-- Show summary
SELECT 
    requirement_type,
    COUNT(*) as count
FROM missions
GROUP BY requirement_type
ORDER BY count DESC;

SELECT '✅ Mission requirements populated!' as status;
