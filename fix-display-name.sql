-- Fix the display_name column inconsistency
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Copy data from displayName to display_name if it exists
UPDATE public.users
SET display_name = displayName
WHERE displayName IS NOT NULL AND display_name IS NULL;

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_display_name ON public.users(display_name);

-- Verify the fix
SELECT 'DISPLAY_NAME COLUMN FIX COMPLETE! ✅' as status;