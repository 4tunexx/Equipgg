-- ================================================
-- FIX MISSIONS TABLE - ADD MISSING COLUMNS
-- Run this to add requirement_type if missing
-- ================================================

-- Add requirement_type column if it doesn't exist
ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS requirement_type TEXT;

-- Add requirement_value column if it doesn't exist  
ALTER TABLE missions
ADD COLUMN IF NOT EXISTS requirement_value INTEGER DEFAULT 1;

-- Verify columns were added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'missions'
AND column_name IN ('requirement_type', 'requirement_value')
ORDER BY column_name;

-- Show sample missions to see current data
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
LIMIT 10;

SELECT '✅ Missions table fixed!' as status;
