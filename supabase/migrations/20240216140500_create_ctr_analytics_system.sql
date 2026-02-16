-- Nombre: create_ctr_analytics_system
-- Descripción: Sistema de tracking de CTR para contenido del feed

-- Tabla de impresiones
CREATE TABLE IF NOT EXISTS public.content_impressions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  user_id UUID, -- Puede ser null para usuarios anónimos
  session_id TEXT, -- Para trackear sesiones anónimas
  
  -- Contexto de impresión
  feed_position INTEGER, -- Posición en el feed (1, 2, 3...)
  feed_type TEXT, -- 'home', 'category', 'trending', 'nearby'
  category TEXT,
  location TEXT,
  
  -- Dispositivo/UA
  user_agent TEXT,
  is_mobile BOOLEAN DEFAULT true,
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de clicks
CREATE TABLE IF NOT EXISTS public.content_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  user_id UUID,
  session_id TEXT,
  
  -- Tipo de click
  click_type TEXT, -- 'details', 'external_link', 'share', 'like', 'affiliate'
  
  -- Contexto
  from_feed_position INTEGER,
  feed_type TEXT,
  
  -- Conversion tracking
  converted BOOLEAN DEFAULT false, -- Si llegó a hacer acción final (reserva, compra, etc)
  conversion_value DECIMAL(10, 2),
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para queries rápidas
CREATE INDEX IF NOT EXISTS idx_impressions_content ON public.content_impressions(content_id);
CREATE INDEX IF NOT EXISTS idx_impressions_session ON public.content_impressions(session_id);
CREATE INDEX IF NOT EXISTS idx_impressions_created ON public.content_impressions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_content ON public.content_clicks(content_id);
CREATE INDEX IF NOT EXISTS idx_clicks_session ON public.content_clicks(session_id);
CREATE INDEX IF NOT EXISTS idx_clicks_created ON public.content_clicks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_type ON public.content_clicks(click_type);

-- Vista materializada de CTR por contenido (actualizada cada hora)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.content_ctr_stats AS
SELECT 
  c.id AS content_id,
  c.title,
  c.category,
  COUNT(DISTINCT i.id) AS total_impressions,
  COUNT(DISTINCT cl.id) AS total_clicks,
  CASE 
    WHEN COUNT(DISTINCT i.id) > 0 
    THEN (COUNT(DISTINCT cl.id)::DECIMAL / COUNT(DISTINCT i.id)::DECIMAL) * 100
    ELSE 0
  END AS ctr_percentage,
  COUNT(DISTINCT CASE WHEN cl.converted = true THEN cl.id END) AS total_conversions,
  SUM(cl.conversion_value) AS total_revenue,
  MAX(i.created_at) AS last_impression,
  MAX(cl.created_at) AS last_click
FROM public.content c
LEFT JOIN public.content_impressions i ON c.id = i.content_id
LEFT JOIN public.content_clicks cl ON c.id = cl.content_id
WHERE c.published = true
GROUP BY c.id, c.title, c.category;

-- Índice en la vista materializada
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_ctr_stats_id ON public.content_ctr_stats(content_id);
CREATE INDEX IF NOT EXISTS idx_content_ctr_stats_ctr ON public.content_ctr_stats(ctr_percentage DESC);

-- Función para refrescar la vista (ejecutar cada hora via cron)
CREATE OR REPLACE FUNCTION refresh_content_ctr_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.content_ctr_stats;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.content_impressions IS 'Tracking de impresiones de contenido en el feed';
COMMENT ON TABLE public.content_clicks IS 'Tracking de clicks y conversiones de contenido';
COMMENT ON MATERIALIZED VIEW public.content_ctr_stats IS 'Estadísticas agregadas de CTR por contenido (refresh cada hora)';
