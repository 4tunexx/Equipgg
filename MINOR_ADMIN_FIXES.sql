-- MINOR ADMIN PANEL FIXES
-- Fix the 2 missing columns found in testing

-- Fix 1: Add missing target_value column to missions table
ALTER TABLE public.missions 
ADD COLUMN IF NOT EXISTS target_value integer DEFAULT 1;

-- Fix 2: Add missing message column to support_tickets table  
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS message text;

-- Optional: Update existing missions to have target_value
UPDATE public.missions 
SET target_value = 1 
WHERE target_value IS NULL;

-- Optional: Add some default support ticket data for testing
-- (You can skip this if you don't want test data)