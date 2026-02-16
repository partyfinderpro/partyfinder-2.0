-- Nombre: telegram_growth_tables
-- Descripción: Tablas para el motor de crecimiento de Telegram

-- 1. Usuarios de Telegram (Leads)
CREATE TABLE IF NOT EXISTS public.telegram_users (
  id BIGINT PRIMARY KEY, -- ID de Telegram
  username TEXT,
  first_name TEXT,
  last_interaction TIMESTAMP DEFAULT NOW(),
  is_premium BOOLEAN DEFAULT false,
  subscribed_to_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Historial de recomendaciones enviadas por Telegram
CREATE TABLE IF NOT EXISTS public.telegram_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_user_id BIGINT REFERENCES public.telegram_users(id),
  venue_id UUID REFERENCES public.content(id),
  sent_at TIMESTAMP DEFAULT NOW(),
  clicked BOOLEAN DEFAULT false
);

-- 3. RLS
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_recommendations ENABLE ROW LEVEL SECURITY;

-- Políticas (Solo lectura/escritura para el bot vía service role)
CREATE POLICY "Bot full access users" ON public.telegram_users USING (true);
CREATE POLICY "Bot full access recs" ON public.telegram_recommendations USING (true);

COMMENT ON TABLE public.telegram_users IS 'Leads capturados a través del bot de Telegram';
