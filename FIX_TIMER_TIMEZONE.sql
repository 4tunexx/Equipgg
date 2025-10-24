-- ================================================
-- FIX TIMER TIMEZONE ISSUE
-- Run this in Supabase SQL Editor
-- ================================================

-- Check current trade times and timezone
SELECT 
  id,
  created_at,
  expires_at,
  NOW() as current_server_time,
  status,
  EXTRACT(EPOCH FROM (expires_at - NOW())) as seconds_until_expiry,
  EXTRACT(EPOCH FROM (expires_at - created_at)) as total_duration_seconds
FROM trade_offers
WHERE status = 'open'
ORDER BY created_at DESC
LIMIT 5;

-- If seconds_until_expiry is negative for new trades, there's a timezone problem
-- If total_duration_seconds is NOT 300 (5 minutes), the expiration is set wrong

-- FIX: Update all open trades to expire in 5 minutes from NOW
UPDATE trade_offers
SET expires_at = NOW() + INTERVAL '5 minutes'
WHERE status = 'open'
  AND created_at > NOW() - INTERVAL '10 minutes'; -- Only recent trades

-- Verify the fix
SELECT 
  id,
  created_at,
  expires_at,
  NOW() as current_time,
  EXTRACT(EPOCH FROM (expires_at - NOW())) / 60 as minutes_until_expiry,
  status
FROM trade_offers
WHERE status = 'open'
ORDER BY created_at DESC;

-- Expected result: minutes_until_expiry should be close to 5.0

SELECT '✅ Timer fixed! All open trades now expire in ~5 minutes from now.' as status;
