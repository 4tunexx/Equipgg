-- =====================================================
-- VERIFY METADATA IS BEING STORED CORRECTLY
-- =====================================================
-- Run this to check if metadata is being stored when crates are opened
-- =====================================================

-- First, check if metadata column exists
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'activity_feed'
  AND column_name = 'metadata';

-- Check recent crate openings and their metadata
SELECT 
    id,
    user_id,
    action,
    item_id,
    description,
    metadata,
    created_at
FROM activity_feed
WHERE action = 'opened_crate'
  AND user_id = 'steam-76561198001993310'
ORDER BY created_at DESC
LIMIT 5;

-- Check metadata structure (cast to text to see the JSON)
SELECT 
    id,
    user_id,
    action,
    item_id,
    metadata::text as metadata_json,
    created_at
FROM activity_feed
WHERE action = 'opened_crate'
  AND user_id = 'steam-76561198001993310'
  AND metadata IS NOT NULL
ORDER BY created_at DESC
LIMIT 3;

-- Check what crates exist and their IDs/names
SELECT 
    id,
    name,
    type,
    image_url,
    is_active
FROM crates
ORDER BY id;

