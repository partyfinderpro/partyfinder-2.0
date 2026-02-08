-- ============================================
-- VENUZ SCE FASE 0: Migración SQL Completa
-- Ejecutar en Supabase SQL Editor (en orden)
-- Fecha: 7 Feb 2026
-- ============================================

-- =============================================
-- PARTE 1: TABLA pending_events (cola cognitiva)
-- =============================================
CREATE TABLE IF NOT EXISTS pending_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Datos crudos del scraper
  raw_title text,
  raw_description text,
  raw_image_url text,
  raw_source_url text,
  raw_lat double precision,
  raw_lng double precision,
  raw_data jsonb,  -- todo el JSON crudo original
  
  -- Clasificación del LLM
  suggested_category text,
  quality_score_suggested int CHECK (quality_score_suggested BETWEEN 0 AND 100),
  suggested_title text,         -- título limpio del LLM
  suggested_description text,   -- descripción limpia del LLM
  is_adult boolean DEFAULT false,
  reason text,                  -- explicación del LLM
  
  -- Control de flujo
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'duplicate')),
  reviewed_by text,             -- 'auto' o 'pablo'
  reviewed_at timestamptz,
  
  -- Metadata
  source_scraper text,          -- qué scraper lo envió: 'google_places', 'camsoda', etc.
  created_at timestamptz DEFAULT now(),
  
  -- Anti-duplicados
  source_url_hash text GENERATED ALWAYS AS (md5(COALESCE(raw_source_url, ''))) STORED
);

-- Índices para pending_events
CREATE INDEX IF NOT EXISTS idx_pending_status ON pending_events(status);
CREATE INDEX IF NOT EXISTS idx_pending_created ON pending_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pending_category ON pending_events(suggested_category);
CREATE INDEX IF NOT EXISTS idx_pending_url_hash ON pending_events(source_url_hash);

-- =============================================
-- PARTE 2: RPCs DE ENGAGEMENT (likes, views)
-- =============================================

-- Incrementar views (ya mencionado en reporte, formalizamos)
CREATE OR REPLACE FUNCTION increment_views(p_content_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE content 
  SET preview_views = COALESCE(preview_views, 0) + 1 
  WHERE id = p_content_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Incrementar likes
CREATE OR REPLACE FUNCTION increment_likes(p_content_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE content 
  SET likes = COALESCE(likes, 0) + 1 
  WHERE id = p_content_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrementar likes (unlike)
CREATE OR REPLACE FUNCTION decrement_likes(p_content_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE content 
  SET likes = GREATEST(COALESCE(likes, 0) - 1, 0) 
  WHERE id = p_content_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Incrementar dislikes  
CREATE OR REPLACE FUNCTION increment_dislikes(p_content_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE content 
  SET dislikes = COALESCE(dislikes, 0) + 1 
  WHERE id = p_content_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aprobar pending_event y moverlo a content
CREATE OR REPLACE FUNCTION approve_pending_event(p_pending_id uuid)
RETURNS uuid AS $$
DECLARE
  v_new_id uuid;
  v_pending pending_events%ROWTYPE;
BEGIN
  -- Obtener el pending
  SELECT * INTO v_pending FROM pending_events WHERE id = p_pending_id AND status = 'pending';
  
  IF v_pending.id IS NULL THEN
    RAISE EXCEPTION 'Pending event not found or already processed';
  END IF;

  -- Insertar en content
  INSERT INTO content (
    title, description, image_url, category, 
    lat, lng, source_url, quality_score,
    source_type, content_tier, active
  ) VALUES (
    COALESCE(v_pending.suggested_title, v_pending.raw_title),
    COALESCE(v_pending.suggested_description, v_pending.raw_description),
    v_pending.raw_image_url,
    v_pending.suggested_category,
    v_pending.raw_lat,
    v_pending.raw_lng,
    v_pending.raw_source_url,
    v_pending.quality_score_suggested,
    'bot',
    CASE WHEN v_pending.quality_score_suggested >= 80 THEN 'verified' ELSE 'scraped' END,
    true
  ) RETURNING id INTO v_new_id;

  -- Marcar como aprobado
  UPDATE pending_events 
  SET status = 'approved', reviewed_by = 'pablo', reviewed_at = now() 
  WHERE id = p_pending_id;

  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- PARTE 3: COLUMNAS FALTANTES EN content
-- =============================================
-- Agregar likes/dislikes si no existen
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'likes') THEN
    ALTER TABLE content ADD COLUMN likes int DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'dislikes') THEN
    ALTER TABLE content ADD COLUMN dislikes int DEFAULT 0;
  END IF;
END $$;

-- =============================================
-- PARTE 4: ÍNDICES DE PERFORMANCE (content)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_content_tier ON content(content_tier);
CREATE INDEX IF NOT EXISTS idx_content_quality ON content(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_content_affiliate ON content(has_affiliate) WHERE has_affiliate = true;
CREATE INDEX IF NOT EXISTS idx_content_featured ON content(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_content_preview_type ON content(preview_type);
CREATE INDEX IF NOT EXISTS idx_content_category ON content(category);
CREATE INDEX IF NOT EXISTS idx_content_active ON content(active) WHERE active = true;

-- =============================================
-- PARTE 5: RLS BÁSICO
-- =============================================
-- Habilitar RLS en content
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Política: todos pueden leer contenido activo
CREATE POLICY IF NOT EXISTS "Public read active content" ON content
  FOR SELECT USING (active = true);

-- Política: solo service_role puede insertar/actualizar
CREATE POLICY IF NOT EXISTS "Service role full access" ON content
  FOR ALL USING (auth.role() = 'service_role');

-- RLS en pending_events (solo service_role)
ALTER TABLE pending_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Service role pending access" ON pending_events
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- VERIFICACIÓN
-- =============================================
-- Ejecuta esto al final para verificar que todo se creó bien:
SELECT 'pending_events' as tabla, count(*) as registros FROM pending_events
UNION ALL
SELECT 'content', count(*) FROM content;
