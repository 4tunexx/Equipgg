-- ================================================
-- CLEANUP OLD TRADES WITH WRONG EXPIRATION
-- Run this in Supabase SQL Editor
-- ================================================

-- STEP 1: Make sure expires_at column exists
-- (This is safe - won't fail if column already exists)
ALTER TABLE trade_offers 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITHOUT TIME ZONE;

-- STEP 2: Update any trades without expires_at to expire immediately
UPDATE trade_offers
SET expires_at = NOW()
WHERE expires_at IS NULL;

-- STEP 3: Delete all trades that have expires_at more than 1 day in the future
-- (These are old trades created with 7-day expiration)

-- First, let's see how many trades will be affected:
SELECT COUNT(*) as old_trades_count
FROM trade_offers
WHERE expires_at > NOW() + INTERVAL '1 day';

-- If you're happy with the count, run this to delete them:
DELETE FROM trade_offers
WHERE expires_at > NOW() + INTERVAL '1 day'
  AND status IN ('open', 'pending');

-- Also delete any expired trades (keeps database clean)
DELETE FROM trade_offers
WHERE expires_at < NOW()
  AND status = 'open';

-- Verify cleanup
SELECT 
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM trade_offers
GROUP BY status
ORDER BY status;

-- ================================================
-- RESULT: Only trades with proper 5-minute 
-- expiration will remain!
-- ================================================

SELECT '✅ OLD TRADES CLEANED UP!' as status;
