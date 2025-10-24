-- ================================================
-- URGENT FIX: MAKE TRADES VISIBLE IN OPEN TRADES
-- Run this NOW in Supabase SQL Editor
-- ================================================

-- Step 1: Check what's wrong with current trades
SELECT 
  id,
  sender_id,
  status,
  created_at,
  expires_at,
  NOW() as current_time,
  (expires_at < NOW()) as is_expired,
  EXTRACT(EPOCH FROM (expires_at - NOW())) / 60 as minutes_until_expiry
FROM trade_offers
WHERE status = 'open'
ORDER BY created_at DESC
LIMIT 5;

-- If is_expired = TRUE or minutes_until_expiry is negative, trades are expired!

-- Step 2: FIX ALL OPEN TRADES - Set expires_at to 5 minutes from NOW
UPDATE trade_offers
SET expires_at = NOW() + INTERVAL '5 minutes'
WHERE status = 'open';

-- Step 3: Verify the fix
SELECT 
  id,
  sender_id,
  status,
  created_at,
  expires_at,
  NOW() as current_time,
  (expires_at < NOW()) as is_expired,
  EXTRACT(EPOCH FROM (expires_at - NOW())) / 60 as minutes_until_expiry
FROM trade_offers
WHERE status = 'open'
ORDER BY created_at DESC;

-- Expected: is_expired = FALSE, minutes_until_expiry = ~5.0

SELECT '✅ ALL TRADES FIXED! Refresh the page now!' as status;
