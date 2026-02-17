-- 20240217000003_analytics_events.sql
-- Motor de analítica para la autonomía del agente

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,          -- 'page_view', 'click', 'favorite', 'geo_alert_triggered'
  venue_id UUID REFERENCES public.content(id),
  user_id UUID, -- Referencia opcional a auth.users o telegram_users
  session_id TEXT,
  region_code TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Índices útiles para rendimiento
CREATE INDEX IF NOT EXISTS idx_analytics_venue ON public.analytics_events(venue_id);
CREATE INDEX IF NOT EXISTS idx_analytics_campaign ON public.analytics_events(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events(event_type);

-- RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Política para el bot/admin (vía service_role)
DROP POLICY IF EXISTS "Admin full access analytics" ON public.analytics_events;
CREATE POLICY "Admin full access analytics" ON public.analytics_events FOR ALL USING (true);

-- RPC auxiliar para baseline (Paso 4 del plan)
CREATE OR REPLACE FUNCTION calculate_region_baseline_ctr(
  p_region text,
  p_exclude_campaign text,
  p_since timestamptz
)
RETURNS TABLE (avg_ctr numeric) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(
    (COUNT(*) FILTER (WHERE event_type = 'click')::numeric * 100.0) / 
    NULLIF(COUNT(*) FILTER (WHERE event_type = 'page_view'), 0),
    0
  )::numeric AS avg_ctr
  FROM analytics_events
  WHERE (region_code = p_region OR p_region IS NULL)
    AND (utm_campaign IS NULL OR utm_campaign != p_exclude_campaign)
    AND created_at >= p_since
    AND event_type IN ('page_view', 'click');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
