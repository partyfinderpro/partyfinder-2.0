-- FIX: Missing Telegram Growth Tables
-- This migration ensures the bot can save leads and send recommendations

CREATE TABLE IF NOT EXISTS public.telegram_users (
    id BIGINT PRIMARY KEY, -- Telegram Chat ID
    username TEXT,
    first_name TEXT,
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_premium BOOLEAN DEFAULT false,
    subscribed_to_alerts BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.telegram_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_user_id BIGINT REFERENCES public.telegram_users(id),
    venue_id UUID REFERENCES public.content(id),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    clicked BOOLEAN DEFAULT false
);

-- RLS
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_recommendations ENABLE ROW LEVEL SECURITY;

-- Policies for public (bot usage)
DROP POLICY IF EXISTS "Bot full access users" ON public.telegram_users;
CREATE POLICY "Bot full access users" ON public.telegram_users FOR ALL USING (true);

DROP POLICY IF EXISTS "Bot full access recs" ON public.telegram_recommendations;
CREATE POLICY "Bot full access recs" ON public.telegram_recommendations FOR ALL USING (true);
