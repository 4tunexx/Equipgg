-- Fix trade_offers table to allow NULL receiver_id for open trades

-- Drop the NOT NULL constraint on receiver_id
ALTER TABLE public.trade_offers 
ALTER COLUMN receiver_id DROP NOT NULL;

-- Verify the change
SELECT 
    column_name, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'trade_offers' 
AND column_name = 'receiver_id';

SELECT 'receiver_id can now be NULL for open trades!' as message;
