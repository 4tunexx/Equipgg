-- ================================================
-- FIX requirement_type NAMES TO MATCH CODE
-- This updates database values to match what the code tracks
-- ================================================

-- Fix: place_bet → bet_placed
UPDATE missions
SET requirement_type = 'bet_placed'
WHERE requirement_type = 'place_bet';

-- Fix: win_bet → bet_won
UPDATE missions
SET requirement_type = 'bet_won'
WHERE requirement_type = 'win_bet';

-- Fix: open_crate → crate_opened
UPDATE missions
SET requirement_type = 'crate_opened'
WHERE requirement_type = 'open_crate';

-- Fix: sell_item → item_sold
UPDATE missions
SET requirement_type = 'item_sold'
WHERE requirement_type = 'sell_item';

-- Fix: buy_perk → item_bought (shop purchases)
UPDATE missions
SET requirement_type = 'item_bought'
WHERE requirement_type = 'buy_perk';

-- Fix: equip_item → item_equipped
UPDATE missions
SET requirement_type = 'item_equipped'
WHERE requirement_type = 'equip_item';

-- login already matches! ✅

-- Show updated values
SELECT 
    requirement_type,
    COUNT(*) as mission_count,
    STRING_AGG(name, ', ') as mission_names
FROM missions
GROUP BY requirement_type
ORDER BY mission_count DESC;

-- Show which requirement types will now work with code
SELECT 
    requirement_type,
    COUNT(*) as count,
    CASE 
        WHEN requirement_type IN ('login', 'bet_placed', 'bet_won', 'crate_opened', 'item_sold', 'item_bought', 'item_equipped', 'trade_completed') 
        THEN '✅ WILL TRACK'
        ELSE '⚠️ NOT TRACKED YET'
    END as status
FROM missions
GROUP BY requirement_type
ORDER BY status DESC, count DESC;

SELECT '✅ Requirement types fixed to match code!' as status;
