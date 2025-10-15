-- Add for_crate column to items table if it doesn't exist
-- This allows marking items that can be used for crate openings

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'items' 
    AND column_name = 'for_crate'
  ) THEN
    ALTER TABLE items ADD COLUMN for_crate BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Column for_crate added successfully';
  ELSE
    RAISE NOTICE 'Column for_crate already exists';
  END IF;
END $$;

-- Update any existing items to have default for_crate value
UPDATE items SET for_crate = FALSE WHERE for_crate IS NULL;
