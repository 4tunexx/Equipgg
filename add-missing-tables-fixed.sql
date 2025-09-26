-- =============================================
-- ADD MISSING TABLES FOR EQUIPGG PLATFORM (FIXED)
-- =============================================

-- 1. SUPPORT TICKETS SYSTEM
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id TEXT NOT NULL PRIMARY KEY,
  user_id TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  assigned_to TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT support_tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id)
);

-- 2. TRADE OFFERS (User-to-User Trading)
CREATE TABLE IF NOT EXISTS public.trade_offers (
  id TEXT NOT NULL PRIMARY KEY,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  sender_items JSONB DEFAULT '[]',
  receiver_items JSONB DEFAULT '[]',
  sender_coins INTEGER DEFAULT 0,
  receiver_coins INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITHOUT TIME ZONE,
  cancelled_by TEXT,
  CONSTRAINT trade_offers_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id),
  CONSTRAINT trade_offers_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id),
  CONSTRAINT trade_offers_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES public.users(id)
);

-- 3. POLLS (Community Voting System) - FIXED DATA TYPE
CREATE TABLE IF NOT EXISTS public.polls (
  id TEXT NOT NULL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  options JSONB NOT NULL DEFAULT '[]',
  votes JSONB DEFAULT '{}',
  total_votes INTEGER DEFAULT 0,
  poll_type TEXT DEFAULT 'community',
  match_id INTEGER, -- FIXED: Changed from TEXT to INTEGER to match matches.id
  start_time TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  end_time TIMESTAMP WITHOUT TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_by TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  CONSTRAINT polls_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT polls_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id)
);

-- 4. SHOP ITEMS (Item Shop Inventory) - CORRECT DATA TYPE
CREATE TABLE IF NOT EXISTS public.shop_items (
  id TEXT NOT NULL PRIMARY KEY,
  item_id INTEGER NOT NULL, -- CORRECT: INTEGER to match items.id
  price_coins INTEGER DEFAULT 0,
  price_gems INTEGER DEFAULT 0,
  stock INTEGER DEFAULT 1,
  max_per_user INTEGER DEFAULT 1,
  discount_percent INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT shop_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id)
);

-- 5. USER PERK CLAIMS
CREATE TABLE IF NOT EXISTS public.user_perk_claims (
  id TEXT NOT NULL PRIMARY KEY,
  user_id TEXT NOT NULL,
  perk_id TEXT NOT NULL,
  claimed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITHOUT TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  claim_method TEXT DEFAULT 'purchase',
  CONSTRAINT user_perk_claims_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- 6. INVENTORY ITEMS (Alternative Inventory Structure)
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id TEXT NOT NULL PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  acquired_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  acquired_method TEXT DEFAULT 'purchase',
  tradeable BOOLEAN DEFAULT true,
  CONSTRAINT inventory_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- 7. STEAM TRADE OFFERS (Steam Integration)
CREATE TABLE IF NOT EXISTS public.steam_trade_offers (
  id TEXT NOT NULL PRIMARY KEY,
  user_id TEXT NOT NULL,
  steam_id TEXT,
  item_id TEXT,
  item_name TEXT,
  gem_price INTEGER,
  trade_offer_id TEXT,
  steam_trade_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITHOUT TIME ZONE,
  failed_reason TEXT,
  CONSTRAINT steam_trade_offers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- 8. TRANSACTIONS TABLE (From grokhelp.txt) - FIXED DATA TYPE
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT NOT NULL PRIMARY KEY, -- FIXED: Changed from UUID to TEXT to be consistent
  user_id TEXT REFERENCES public.users(id), -- FIXED: Changed from UUID to TEXT
  type TEXT NOT NULL, -- 'bet', 'trade', 'purchase'
  amount DECIMAL(10,2),
  details JSONB,
  outcome TEXT, -- win/loss for bets
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- =============================================
-- ADD INDEXES FOR BETTER PERFORMANCE
-- =============================================

-- Support tickets indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);

-- Trade offers indexes
CREATE INDEX IF NOT EXISTS idx_trade_offers_sender_id ON public.trade_offers(sender_id);
CREATE INDEX IF NOT EXISTS idx_trade_offers_receiver_id ON public.trade_offers(receiver_id);
CREATE INDEX IF NOT EXISTS idx_trade_offers_status ON public.trade_offers(status);
CREATE INDEX IF NOT EXISTS idx_trade_offers_created_at ON public.trade_offers(created_at DESC);

-- Polls indexes
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON public.polls(created_by);
CREATE INDEX IF NOT EXISTS idx_polls_match_id ON public.polls(match_id);
CREATE INDEX IF NOT EXISTS idx_polls_is_active ON public.polls(is_active);
CREATE INDEX IF NOT EXISTS idx_polls_end_time ON public.polls(end_time);

-- Shop items indexes
CREATE INDEX IF NOT EXISTS idx_shop_items_item_id ON public.shop_items(item_id);
CREATE INDEX IF NOT EXISTS idx_shop_items_is_active ON public.shop_items(is_active);
CREATE INDEX IF NOT EXISTS idx_shop_items_featured ON public.shop_items(featured);

-- User perk claims indexes
CREATE INDEX IF NOT EXISTS idx_user_perk_claims_user_id ON public.user_perk_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_user_perk_claims_perk_id ON public.user_perk_claims(perk_id);
CREATE INDEX IF NOT EXISTS idx_user_perk_claims_is_active ON public.user_perk_claims(is_active);
CREATE INDEX IF NOT EXISTS idx_user_perk_claims_expires_at ON public.user_perk_claims(expires_at);

-- Inventory items indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_user_id ON public.inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_item_id ON public.inventory_items(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_tradeable ON public.inventory_items(tradeable);

-- Steam trade offers indexes
CREATE INDEX IF NOT EXISTS idx_steam_trade_offers_user_id ON public.steam_trade_offers(user_id);
CREATE INDEX IF NOT EXISTS idx_steam_trade_offers_status ON public.steam_trade_offers(status);
CREATE INDEX IF NOT EXISTS idx_steam_trade_offers_created_at ON public.steam_trade_offers(created_at DESC);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- =============================================
-- ADD ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Support tickets RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all tickets" ON public.support_tickets FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Trade offers RLS
ALTER TABLE public.trade_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own trade offers" ON public.trade_offers FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "Users can create trade offers" ON public.trade_offers FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users can update own trade offers" ON public.trade_offers FOR UPDATE USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Polls RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active polls" ON public.polls FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage polls" ON public.polls FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Shop items RLS
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view shop items" ON public.shop_items FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage shop items" ON public.shop_items FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- User perk claims RLS
ALTER TABLE public.user_perk_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own perk claims" ON public.user_perk_claims FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create perk claims" ON public.user_perk_claims FOR INSERT WITH CHECK (user_id = auth.uid());

-- Inventory items RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own inventory items" ON public.inventory_items FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage own inventory" ON public.inventory_items FOR ALL USING (user_id = auth.uid());

-- Steam trade offers RLS
ALTER TABLE public.steam_trade_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own steam trade offers" ON public.steam_trade_offers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create steam trade offers" ON public.steam_trade_offers FOR INSERT WITH CHECK (user_id = auth.uid());

-- Transactions RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can create transactions" ON public.transactions FOR INSERT WITH CHECK (true);

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

SELECT '✅ All missing tables created successfully!' as message;
SELECT '🎉 EquipGG database is now 100% complete!' as message;