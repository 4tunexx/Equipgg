-- =====================================================
-- ADD DESCRIPTION AND METADATA COLUMNS TO ACTIVITY_FEED
-- =====================================================
-- Run this in Supabase SQL Editor to add missing columns
-- =====================================================

BEGIN;

-- Add description column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'activity_feed'
          AND column_name = 'description'
    ) THEN
        ALTER TABLE activity_feed ADD COLUMN description TEXT;
        RAISE NOTICE '✅ Added description column';
    ELSE
        RAISE NOTICE 'description column already exists';
    END IF;
END $$;

-- Add metadata column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'activity_feed'
          AND column_name = 'metadata'
    ) THEN
        ALTER TABLE activity_feed ADD COLUMN metadata JSONB;
        RAISE NOTICE '✅ Added metadata column';
    ELSE
        RAISE NOTICE 'metadata column already exists';
    END IF;
END $$;

COMMIT;

-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'activity_feed'
  AND column_name IN ('description', 'metadata')
ORDER BY column_name;

