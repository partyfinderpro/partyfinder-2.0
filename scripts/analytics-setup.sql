-- ============================================================
-- VENUZ - SQL para Analytics y mejoras de Grok
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. TABLA DE ANALYTICS EVENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  content_id uuid REFERENCES public.content(id) ON DELETE SET NULL,
  user_id uuid,
  metadata jsonb DEFAULT '{}',
  path text,
  referrer text,
  user_agent text,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_content_id ON public.analytics_events(content_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON public.analytics_events(user_id);

-- RLS para analytics
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden LEER analytics (para dashboard)
CREATE POLICY "Admins can read analytics" ON public.analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Cualquiera puede INSERTAR (para tracking anónimo)
CREATE POLICY "Anyone can insert analytics" ON public.analytics_events
  FOR INSERT WITH CHECK (true);


-- ============================================================
-- 2. FUNCIÓN RPC PARA INCREMENTAR LIKES ATÓMICAMENTE
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_likes(content_id uuid, amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.content
  SET likes = GREATEST(0, COALESCE(likes, 0) + amount)
  WHERE id = content_id;
END;
$$;


-- ============================================================
-- 3. FUNCIÓN RPC PARA INCREMENTAR VIEWS
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_views(content_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.content
  SET views = COALESCE(views, 0) + 1
  WHERE id = content_id;
END;
$$;


-- ============================================================
-- 4. VISTA PARA MÉTRICAS DEL FEED
-- ============================================================

CREATE OR REPLACE VIEW public.feed_metrics AS
SELECT 
  category,
  COUNT(*) as total_items,
  SUM(views) as total_views,
  SUM(likes) as total_likes,
  AVG(views) as avg_views,
  AVG(likes) as avg_likes,
  COUNT(*) FILTER (WHERE is_verified = true) as verified_count,
  COUNT(*) FILTER (WHERE is_premium = true) as premium_count,
  COUNT(*) FILTER (WHERE affiliate_source IS NOT NULL) as affiliate_count
FROM public.content
GROUP BY category
ORDER BY total_views DESC;


-- ============================================================
-- 5. VISTA PARA ANALYTICS SUMMARY (últimos 7 días)
-- ============================================================

CREATE OR REPLACE VIEW public.analytics_summary AS
SELECT 
  event_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT content_id) as unique_content,
  DATE(created_at) as event_date
FROM public.analytics_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY event_type, DATE(created_at)
ORDER BY event_date DESC, event_count DESC;


-- ============================================================
-- 6. COLUMNA updated_at SI NO EXISTE
-- ============================================================

ALTER TABLE public.content 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS content_updated_at ON public.content;
CREATE TRIGGER content_updated_at
  BEFORE UPDATE ON public.content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();


-- ============================================================
-- 7. GRANT PERMISOS
-- ============================================================

GRANT SELECT ON public.feed_metrics TO authenticated;
GRANT SELECT ON public.analytics_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_likes TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.increment_views TO authenticated, anon;


-- ============================================================
-- VERIFICACIÓN
-- ============================================================

-- Ver que todo se creó correctamente
SELECT 'analytics_events' as table_name, COUNT(*) as rows FROM public.analytics_events
UNION ALL
SELECT 'content', COUNT(*) FROM public.content;
