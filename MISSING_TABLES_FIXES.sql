-- MISSING TABLES SQL FIX
-- Add all missing tables to complete the database schema
-- Execute these statements in Supabase Dashboard -> SQL Editor

-- Table: crate_openings
CREATE TABLE public.crate_openings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id text,
  crate_id integer,
  item_received_id integer,
  opened_at timestamp without time zone DEFAULT now(),
  CONSTRAINT crate_openings_pkey PRIMARY KEY (id),
  CONSTRAINT crate_openings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Table: game_history
CREATE TABLE public.game_history (
  id text NOT NULL,
  user_id text,
  game_type text,
  bet_amount integer,
  winnings integer DEFAULT 0,
  profit integer,
  multiplier real,
  game_data text,
  result text,
  tiles_cleared integer DEFAULT 0,
  xp_gained integer DEFAULT 0,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT game_history_pkey PRIMARY KEY (id),
  CONSTRAINT game_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Table: steam_trade_offers
CREATE TABLE public.steam_trade_offers (
  id text NOT NULL,
  user_id text NOT NULL,
  steam_id text,
  item_id text,
  item_name text,
  gem_price integer,
  trade_offer_id text,
  steam_trade_url text,
  status text DEFAULT 'pending'::text,
  created_at timestamp without time zone DEFAULT now(),
  completed_at timestamp without time zone,
  failed_reason text,
  CONSTRAINT steam_trade_offers_pkey PRIMARY KEY (id),
  CONSTRAINT steam_trade_offers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Table: match_votes
CREATE TABLE public.match_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  match_id uuid NOT NULL,
  prediction text NOT NULL CHECK (prediction = ANY (ARRAY['team_a'::text, 'team_b'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT match_votes_pkey PRIMARY KEY (id),
  CONSTRAINT match_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT match_votes_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id)
);

-- Table: admin_logs
CREATE TABLE public.admin_logs (
  id text NOT NULL,
  admin_id text,
  action text,
  details text,
  target_id text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT admin_logs_pkey PRIMARY KEY (id),
  CONSTRAINT admin_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id)
);

-- Table: payment_intents
CREATE TABLE public.payment_intents (
  id text NOT NULL,
  user_id text,
  amount numeric,
  currency text DEFAULT 'USD'::text,
  status text DEFAULT 'pending'::text,
  stripe_payment_intent_id text,
  paypal_order_id text,
  gems integer,
  created_at timestamp without time zone DEFAULT now(),
  completed_at timestamp without time zone,
  CONSTRAINT payment_intents_pkey PRIMARY KEY (id)
);

-- Table: forum_categories
CREATE TABLE public.forum_categories (
  id text NOT NULL,
  name text,
  description text,
  icon text,
  topic_count integer DEFAULT 0,
  post_count integer DEFAULT 0,
  display_order integer DEFAULT 0,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT forum_categories_pkey PRIMARY KEY (id)
);

-- Table: cs2_skins
CREATE TABLE public.cs2_skins (
  id text NOT NULL,
  name text,
  rarity text,
  gems integer,
  steam_market_price numeric,
  category text,
  enabled boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT cs2_skins_pkey PRIMARY KEY (id)
);

-- Table: server_seeds
CREATE TABLE public.server_seeds (
  id text NOT NULL,
  seed text,
  hashed_seed text,
  is_revealed boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  revealed_at timestamp without time zone,
  CONSTRAINT server_seeds_pkey PRIMARY KEY (id)
);

-- Table: flash_sales
CREATE TABLE public.flash_sales (
  id integer NOT NULL DEFAULT nextval('flash_sales_id_seq'::regclass),
  item_id integer,
  original_price numeric,
  sale_price numeric,
  discount_percent integer,
  start_time timestamp without time zone,
  end_time timestamp without time zone,
  active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT flash_sales_pkey PRIMARY KEY (id)
);

-- Table: user_rewards
CREATE TABLE public.user_rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['login_bonus'::text, 'level_up'::text, 'achievement'::text, 'referral'::text, 'purchase'::text, 'event'::text])),
  trigger_condition text,
  reward_coins integer DEFAULT 0,
  reward_xp integer DEFAULT 0,
  reward_gems integer DEFAULT 0,
  reward_item text,
  is_active boolean DEFAULT true,
  max_claims_per_user integer DEFAULT 1,
  cooldown_hours integer DEFAULT 24,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_rewards_pkey PRIMARY KEY (id)
);

-- Table: user_perks
CREATE TABLE public.user_perks (
  id text NOT NULL,
  user_id text,
  perk_id text,
  perk_name text,
  perk_type text,
  duration_hours integer,
  expires_at timestamp without time zone,
  is_active boolean DEFAULT true,
  applied_at timestamp without time zone DEFAULT now(),
  CONSTRAINT user_perks_pkey PRIMARY KEY (id),
  CONSTRAINT user_perks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
