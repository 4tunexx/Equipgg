-- Simple fix: Just add page_toggles to existing site_settings table
-- Your activity_feed table already exists with correct structure!

-- Insert page_toggles setting if it doesn't exist
INSERT INTO site_settings (id, setting_key, setting_value, setting_type, description)
VALUES (gen_random_uuid(), 'page_toggles', '{}', 'json', 'Page visibility toggles for dashboard sections')
ON CONFLICT (setting_key) DO NOTHING;

-- That's it! Your tables already exist with the right structure.
-- The code has been adapted to work with your existing activity_feed structure.
