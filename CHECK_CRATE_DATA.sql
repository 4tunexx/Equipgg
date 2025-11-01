-- =====================================================
-- CHECK CRATE DATA IN DATABASE
-- =====================================================
-- Run this to see what crates exist and what data is in activity_feed
-- =====================================================

-- Check what crates exist
SELECT 
    id,
    name,
    description,
    image_url,
    type,
    is_active,
    coin_price,
    gem_price,
    xp_reward,
    coin_reward,
    gem_reward
FROM crates
ORDER BY id;

-- Check activity_feed for crate openings (last 10)
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
ORDER BY created_at DESC
LIMIT 10;

-- Check a specific user's crate openings
SELECT 
    id,
    user_id,
    action,
    item_id,
    description,
    metadata,
    created_at
FROM activity_feed
WHERE user_id = 'steam-76561198001993310'
  AND action = 'opened_crate'
ORDER BY created_at DESC
LIMIT 5;

-- Check metadata structure for a crate opening
SELECT 
    id,
    user_id,
    action,
    item_id,
    description,
    metadata::text as metadata_text,
    created_at
FROM activity_feed
WHERE user_id = 'steam-76561198001993310'
  AND action = 'opened_crate'
ORDER BY created_at DESC
LIMIT 1;

-- Check if metadata column exists and its type
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'activity_feed'
  AND column_name IN ('description', 'metadata');

-- Check if description column exists and its type
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'activity_feed'
  AND column_name = 'description';

