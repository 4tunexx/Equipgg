-- ================================================
-- CHECK MISSIONS TABLE STRUCTURE
-- Run this FIRST to see what columns exist
-- ================================================

-- Show ALL columns in missions table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'missions'
ORDER BY ordinal_position;
