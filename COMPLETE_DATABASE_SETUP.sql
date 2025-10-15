-- ============================================
-- COMPLETE DATABASE SETUP & VERIFICATION
-- Run this in Supabase SQL Editor to ensure all tables and columns exist
-- ============================================

-- 1. ENSURE ITEMS TABLE HAS ALL REQUIRED COLUMNS
-- --------------------------------------------
DO $$ 
BEGIN
  -- Add for_crate column if missing
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'for_crate'
  ) THEN
    ALTER TABLE items ADD COLUMN for_crate BOOLEAN DEFAULT FALSE;
    RAISE NOTICE '✅ Added for_crate column to items table';
  ELSE
    RAISE NOTICE '✓ for_crate column already exists';
  END IF;

  -- Ensure other critical columns exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'is_equipable'
  ) THEN
    ALTER TABLE items ADD COLUMN is_equipable BOOLEAN DEFAULT TRUE;
    RAISE NOTICE '✅ Added is_equipable column to items table';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'image'
  ) THEN
    ALTER TABLE items ADD COLUMN image TEXT;
    RAISE NOTICE '✅ Added image column to items table';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'coin_price'
  ) THEN
    ALTER TABLE items ADD COLUMN coin_price INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Added coin_price column to items table';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'gem_price'
  ) THEN
    ALTER TABLE items ADD COLUMN gem_price INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Added gem_price column to items table';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE items ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    RAISE NOTICE '✅ Added is_active column to items table';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'featured'
  ) THEN
    ALTER TABLE items ADD COLUMN featured BOOLEAN DEFAULT FALSE;
    RAISE NOTICE '✅ Added featured column to items table';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'type'
  ) THEN
    ALTER TABLE items ADD COLUMN type TEXT DEFAULT 'weapon';
    RAISE NOTICE '✅ Added type column to items table';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'category'
  ) THEN
    ALTER TABLE items ADD COLUMN category TEXT;
    RAISE NOTICE '✅ Added category column to items table';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'rarity'
  ) THEN
    ALTER TABLE items ADD COLUMN rarity TEXT DEFAULT 'Common';
    RAISE NOTICE '✅ Added rarity column to items table';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'name'
  ) THEN
    ALTER TABLE items ADD COLUMN name TEXT NOT NULL;
    RAISE NOTICE '✅ Added name column to items table';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'description'
  ) THEN
    ALTER TABLE items ADD COLUMN description TEXT;
    RAISE NOTICE '✅ Added description column to items table';
  END IF;
END $$;

-- Update any NULL values
UPDATE items SET for_crate = FALSE WHERE for_crate IS NULL;
UPDATE items SET is_equipable = TRUE WHERE is_equipable IS NULL;
UPDATE items SET is_active = TRUE WHERE is_active IS NULL;
UPDATE items SET featured = FALSE WHERE featured IS NULL;

-- 2. ENSURE USER_INVENTORY TABLE HAS REQUIRED COLUMNS
-- --------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'user_inventory' AND column_name = 'equipped'
  ) THEN
    ALTER TABLE user_inventory ADD COLUMN equipped BOOLEAN DEFAULT FALSE;
    RAISE NOTICE '✅ Added equipped column to user_inventory table';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'user_inventory' AND column_name = 'slot_type'
  ) THEN
    ALTER TABLE user_inventory ADD COLUMN slot_type TEXT;
    RAISE NOTICE '✅ Added slot_type column to user_inventory table';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'user_inventory' AND column_name = 'stat_trak_wins'
  ) THEN
    ALTER TABLE user_inventory ADD COLUMN stat_trak_wins INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Added stat_trak_wins column to user_inventory table';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'user_inventory' AND column_name = 'item_name'
  ) THEN
    ALTER TABLE user_inventory ADD COLUMN item_name TEXT;
    RAISE NOTICE '✅ Added item_name column to user_inventory table';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'user_inventory' AND column_name = 'item_type'
  ) THEN
    ALTER TABLE user_inventory ADD COLUMN item_type TEXT;
    RAISE NOTICE '✅ Added item_type column to user_inventory table';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'user_inventory' AND column_name = 'rarity'
  ) THEN
    ALTER TABLE user_inventory ADD COLUMN rarity TEXT;
    RAISE NOTICE '✅ Added rarity column to user_inventory table';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'user_inventory' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE user_inventory ADD COLUMN image_url TEXT;
    RAISE NOTICE '✅ Added image_url column to user_inventory table';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'user_inventory' AND column_name = 'value'
  ) THEN
    ALTER TABLE user_inventory ADD COLUMN value INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Added value column to user_inventory table';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'user_inventory' AND column_name = 'obtained_from'
  ) THEN
    ALTER TABLE user_inventory ADD COLUMN obtained_from TEXT;
    RAISE NOTICE '✅ Added obtained_from column to user_inventory table';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'user_inventory' AND column_name = 'acquired_at'
  ) THEN
    ALTER TABLE user_inventory ADD COLUMN acquired_at TIMESTAMP DEFAULT NOW();
    RAISE NOTICE '✅ Added acquired_at column to user_inventory table';
  END IF;
END $$;

-- 3. CREATE EQUIP FUNCTION IF NOT EXISTS
-- --------------------------------------------
CREATE OR REPLACE FUNCTION equip_inventory_item(
  p_user_id UUID,
  p_item_id TEXT,
  p_slot TEXT
)
RETURNS TABLE(id TEXT, equipped BOOLEAN, slot_type TEXT) AS $$
BEGIN
  -- Unequip any currently equipped item in this slot
  UPDATE user_inventory
  SET equipped = FALSE, slot_type = NULL
  WHERE user_id = p_user_id 
    AND slot_type = p_slot 
    AND equipped = TRUE;

  -- Equip the new item
  UPDATE user_inventory
  SET equipped = TRUE, slot_type = p_slot
  WHERE user_id = p_user_id 
    AND user_inventory.id = p_item_id;

  -- Return the equipped item
  RETURN QUERY
  SELECT user_inventory.id, user_inventory.equipped, user_inventory.slot_type
  FROM user_inventory
  WHERE user_id = p_user_id 
    AND user_inventory.id = p_item_id;
END;
$$ LANGUAGE plpgsql;

-- 4. VERIFY USERS TABLE HAS BALANCE COLUMNS
-- --------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'coins'
  ) THEN
    ALTER TABLE users ADD COLUMN coins INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Added coins column to users table';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'gems'
  ) THEN
    ALTER TABLE users ADD COLUMN gems INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Added gems column to users table';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'xp'
  ) THEN
    ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Added xp column to users table';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'level'
  ) THEN
    ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1;
    RAISE NOTICE '✅ Added level column to users table';
  END IF;
END $$;

-- 5. CREATE INDEXES FOR PERFORMANCE
-- --------------------------------------------
CREATE INDEX IF NOT EXISTS idx_items_rarity ON items(rarity);
CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
CREATE INDEX IF NOT EXISTS idx_items_active ON items(is_active);
CREATE INDEX IF NOT EXISTS idx_items_featured ON items(featured);
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_equipped ON user_inventory(user_id, equipped);
CREATE INDEX IF NOT EXISTS idx_user_inventory_item_id ON user_inventory(item_id);

-- 6. VERIFY SHOP_ITEMS TABLE
-- --------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'shop_items'
  ) THEN
    CREATE TABLE shop_items (
      id TEXT PRIMARY KEY,
      item_id TEXT REFERENCES items(id),
      name TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      stock INTEGER,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );
    RAISE NOTICE '✅ Created shop_items table';
  ELSE
    RAISE NOTICE '✓ shop_items table already exists';
  END IF;
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- Run these to check your setup:
-- ============================================

-- Check items table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'items'
ORDER BY ordinal_position;

-- Check user_inventory table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_inventory'
ORDER BY ordinal_position;

-- Check users table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Count items by rarity
SELECT rarity, COUNT(*) as count
FROM items
GROUP BY rarity
ORDER BY count DESC;

-- Check for items with missing data
SELECT 
  COUNT(*) FILTER (WHERE image IS NULL) as missing_image,
  COUNT(*) FILTER (WHERE coin_price IS NULL OR coin_price = 0) as missing_price,
  COUNT(*) FILTER (WHERE rarity IS NULL) as missing_rarity
FROM items;

SELECT '✅ DATABASE SETUP COMPLETE!' as status;
