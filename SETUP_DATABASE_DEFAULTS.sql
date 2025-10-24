-- ================================================
-- SETUP DATABASE DEFAULTS FOR TRADE TIMES
-- This ensures consistent server-side timestamps
-- ================================================

-- Step 1: Add default for created_at (if not exists)
ALTER TABLE trade_offers 
ALTER COLUMN created_at SET DEFAULT NOW();

-- Step 2: Add default for expires_at (NOW + 5 minutes)
ALTER TABLE trade_offers 
ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '5 minutes');

-- Step 3: Fix all existing open trades
UPDATE trade_offers
SET 
  expires_at = NOW() + INTERVAL '5 minutes',
  created_at = COALESCE(created_at, NOW())
WHERE status = 'open';

-- Step 4: Verify defaults are set
SELECT 
  column_name, 
  column_default,
  data_type
FROM information_schema.columns
WHERE table_name = 'trade_offers' 
  AND column_name IN ('created_at', 'expires_at');

-- Step 5: Check existing trades
SELECT 
  id,
  status,
  created_at,
  expires_at,
  NOW() as current_time,
  (expires_at > NOW()) as is_valid,
  EXTRACT(EPOCH FROM (expires_at - NOW())) / 60 as minutes_remaining
FROM trade_offers
WHERE status = 'open'
ORDER BY created_at DESC
LIMIT 5;

-- Expected results:
-- - created_at default: now()
-- - expires_at default: (now() + '00:05:00'::interval)
-- - is_valid: true
-- - minutes_remaining: ~5.0

SELECT '✅ Database defaults configured! New trades will use server time.' as status;
