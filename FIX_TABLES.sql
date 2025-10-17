-- FIX DATABASE TABLE ISSUES

-- 1. FIX MATCHES TABLE: make match_date nullable
ALTER TABLE matches ALTER COLUMN match_date DROP NOT NULL;

-- Alternative: if you want to keep it required, add default
-- ALTER TABLE matches ALTER COLUMN match_date SET DEFAULT CURRENT_TIMESTAMP;

-- 2. FIX RANKS TABLE: add is_active column
ALTER TABLE ranks ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. FIX GEM_PACKAGES TABLE: add auto-increment or UUID for id
-- Check current structure first
DO $$
BEGIN
  -- Try to alter gem_packages id to have default
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gem_packages') THEN
    EXECUTE 'ALTER TABLE gem_packages ALTER COLUMN id SET DEFAULT gen_random_uuid()';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- If id is integer type, use serial
    EXECUTE 'CREATE SEQUENCE IF NOT EXISTS gem_packages_id_seq';
    EXECUTE 'ALTER TABLE gem_packages ALTER COLUMN id SET DEFAULT nextval(''gem_packages_id_seq'')';
END$$;

-- DONE! Run this and restart your server.
