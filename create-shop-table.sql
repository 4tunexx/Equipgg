-- Create shop_items table for the EquipGG shop functionality

CREATE TABLE IF NOT EXISTS shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id TEXT REFERENCES items(id),
  price DECIMAL NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  discount_percentage INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;

-- Create RLS Policy for public read access
CREATE POLICY "Public read shop_items" ON shop_items FOR SELECT USING (is_active = true);

-- Create some sample items first
INSERT INTO items (id, name, type, rarity, image_url, market_value) VALUES
('item-ak-redline', 'AK-47 | Redline', 'weapon', 'Classified', 'https://picsum.photos/seed/ak47-redline/300/200', 2500),
('item-awp-dragon', 'AWP | Dragon Lore', 'weapon', 'Covert', 'https://picsum.photos/seed/awp-dragon/300/200', 15000),
('item-knife-fade', '★ Karambit | Fade', 'knife', 'Covert', 'https://picsum.photos/seed/karambit-fade/300/200', 50000),
('item-gloves-crimson', '★ Specialist Gloves | Crimson Web', 'gloves', 'Covert', 'https://picsum.photos/seed/gloves-crimson/300/200', 8000)
ON CONFLICT (id) DO NOTHING;

-- Create shop items referencing the items
INSERT INTO shop_items (item_id, price, stock, is_featured, is_active) VALUES
('item-ak-redline', 2500, 10, false, true),
('item-awp-dragon', 15000, 2, true, true),
('item-knife-fade', 50000, 1, true, true),
('item-gloves-crimson', 8000, 3, false, true);

COMMIT;