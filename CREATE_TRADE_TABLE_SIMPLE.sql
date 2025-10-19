-- Simple trade_offers table creation (if it doesn't exist)

CREATE TABLE IF NOT EXISTS public.trade_offers (
    id text NOT NULL,
    sender_id text NOT NULL,
    receiver_id text,
    sender_items jsonb DEFAULT '[]'::jsonb,
    receiver_items jsonb DEFAULT '[]'::jsonb,
    sender_coins integer DEFAULT 0,
    receiver_coins integer DEFAULT 0,
    status text DEFAULT 'open'::text,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    cancelled_by text,
    CONSTRAINT trade_offers_pkey PRIMARY KEY (id),
    CONSTRAINT trade_offers_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT trade_offers_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT trade_offers_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES public.users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trade_offers_sender ON public.trade_offers(sender_id);
CREATE INDEX IF NOT EXISTS idx_trade_offers_receiver ON public.trade_offers(receiver_id);
CREATE INDEX IF NOT EXISTS idx_trade_offers_status ON public.trade_offers(status);
CREATE INDEX IF NOT EXISTS idx_trade_offers_created_at ON public.trade_offers(created_at DESC);

-- Enable RLS
ALTER TABLE public.trade_offers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view trades they're involved in" ON public.trade_offers;
DROP POLICY IF EXISTS "Users can create trades" ON public.trade_offers;
DROP POLICY IF EXISTS "Users can update their own trades" ON public.trade_offers;

-- Create RLS Policies
CREATE POLICY "Users can view trades they're involved in"
    ON public.trade_offers FOR SELECT
    USING (
        sender_id = current_setting('request.jwt.claims', true)::json->>'sub' OR 
        receiver_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
        status = 'open'
    );

CREATE POLICY "Users can create trades"
    ON public.trade_offers FOR INSERT
    WITH CHECK (sender_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update their own trades"
    ON public.trade_offers FOR UPDATE
    USING (
        sender_id = current_setting('request.jwt.claims', true)::json->>'sub' OR 
        receiver_id = current_setting('request.jwt.claims', true)::json->>'sub'
    );

SELECT 'Trade table created successfully!' as message;
