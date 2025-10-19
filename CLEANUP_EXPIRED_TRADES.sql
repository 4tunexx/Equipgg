-- Auto-expire trades after 1 hour if no offer is made
-- Run this as a scheduled job or trigger

-- Update trades that are still 'open' after 1 hour
UPDATE public.trade_offers
SET status = 'expired'
WHERE status = 'open'
AND created_at < NOW() - INTERVAL '1 hour';

-- Update trades that are 'pending' (offer made) after 24 hours
UPDATE public.trade_offers
SET status = 'expired'
WHERE status = 'pending'
AND created_at < NOW() - INTERVAL '24 hours';

SELECT 'Expired trades cleaned up!' as message;
