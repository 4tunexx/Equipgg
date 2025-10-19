-- ============================================================================
-- TRADING SYSTEM TABLES
-- ============================================================================

-- Check if trade_offers table exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'trade_offers') THEN
        CREATE TABLE public.trade_offers (
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
        
        -- Create indexes for better performance
        CREATE INDEX idx_trade_offers_sender ON public.trade_offers(sender_id);
        CREATE INDEX idx_trade_offers_receiver ON public.trade_offers(receiver_id);
        CREATE INDEX idx_trade_offers_status ON public.trade_offers(status);
        CREATE INDEX idx_trade_offers_created_at ON public.trade_offers(created_at DESC);
        
        -- Enable RLS
        ALTER TABLE public.trade_offers ENABLE ROW LEVEL SECURITY;
        
        -- RLS Policies
        CREATE POLICY "Users can view trades they're involved in"
            ON public.trade_offers FOR SELECT
            USING (
                auth.uid()::text = sender_id OR 
                auth.uid()::text = receiver_id OR
                status = 'open'
            );
        
        CREATE POLICY "Users can create trades"
            ON public.trade_offers FOR INSERT
            WITH CHECK (auth.uid()::text = sender_id);
        
        CREATE POLICY "Users can update their own trades"
            ON public.trade_offers FOR UPDATE
            USING (
                auth.uid()::text = sender_id OR 
                auth.uid()::text = receiver_id
            );
        
        RAISE NOTICE 'trade_offers table created successfully';
    ELSE
        RAISE NOTICE 'trade_offers table already exists';
    END IF;
END $$;

-- Add status values if not already added
DO $$
BEGIN
    -- Check if we need to add any status constraints
    -- Status can be: 'open', 'pending', 'completed', 'declined', 'cancelled'
    RAISE NOTICE 'Trade statuses: open, pending, completed, declined, cancelled';
END $$;

-- Enable realtime for trade_offers
ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_offers;

SELECT 'Trading tables setup complete!' as message;
