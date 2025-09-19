-- Quick fix for EquipGG database column naming
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/projects/rxamnospcmbtgzptmmxl/sql/new

-- Fix the users table column name
ALTER TABLE public.users RENAME COLUMN displayname TO display_name;

-- Verify the fix
SELECT id, email, display_name FROM public.users LIMIT 1;

-- Success! Your site should now work at https://equipgg.net
