-- Fix items table - clear placeholder/wrong image URLs so auto-generation works
-- This will make the system use getItemImageUrl() to generate correct CSGODatabase URLs

UPDATE items 
SET image = NULL 
WHERE image IN ('logo.png', '/logo.png', 'default-item.png', '/default-item.png', '/assets/placeholder.svg')
   OR image LIKE '%logo%' 
   OR image LIKE '%default%';

-- Also fix user_inventory table
UPDATE user_inventory 
SET image_url = NULL 
WHERE image_url IN ('logo.png', '/logo.png', 'default-item.png', '/default-item.png', '/assets/placeholder.svg')
   OR image_url LIKE '%logo%' 
   OR image_url LIKE '%default%';

-- Check what items still have custom URLs (these might be intentional)
SELECT id, name, type, image 
FROM items 
WHERE image IS NOT NULL;

-- Check what inventory items still have custom URLs
SELECT id, item_name, item_type, image_url 
FROM user_inventory 
WHERE image_url IS NOT NULL;
