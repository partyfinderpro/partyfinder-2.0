-- =============================================
-- VENUZ - CAMPOS PARA CONTENIDO DINÁMICO
-- Versión Final (Claude + Grok)
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- PREVIEW DINÁMICO
ALTER TABLE content ADD COLUMN IF NOT EXISTS official_website text;
ALTER TABLE content ADD COLUMN IF NOT EXISTS preview_video_url text;
ALTER TABLE content ADD COLUMN IF NOT EXISTS preview_type text DEFAULT 'image';
-- Valores: 'video', 'gif', 'iframe', 'image', 'embed'

ALTER TABLE content ADD COLUMN IF NOT EXISTS iframe_preview_url text;
ALTER TABLE content ADD COLUMN IF NOT EXISTS embed_code text;
ALTER TABLE content ADD COLUMN IF NOT EXISTS gallery_urls text[];
ALTER TABLE content ADD COLUMN IF NOT EXISTS has_live_preview boolean DEFAULT false;
ALTER TABLE content ADD COLUMN IF NOT EXISTS youtube_review_url text;

-- AFILIADOS Y MONETIZACIÓN
ALTER TABLE content ADD COLUMN IF NOT EXISTS affiliate_url text;
ALTER TABLE content ADD COLUMN IF NOT EXISTS affiliate_network text;
ALTER TABLE content ADD COLUMN IF NOT EXISTS has_affiliate boolean DEFAULT false;
ALTER TABLE content ADD COLUMN IF NOT EXISTS affiliate_clicks integer DEFAULT 0;

-- CALIDAD Y PRIORIZACIÓN
ALTER TABLE content ADD COLUMN IF NOT EXISTS content_tier text DEFAULT 'scraped';
-- Valores: 'premium', 'verified', 'scraped'

ALTER TABLE content ADD COLUMN IF NOT EXISTS quality_score integer DEFAULT 50;
ALTER TABLE content ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE content ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE content ADD COLUMN IF NOT EXISTS priority_boost integer DEFAULT 0;

-- SOURCE TRACKING
ALTER TABLE content ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'bot';
-- Valores: 'manual', 'bot', 'api', 'user'

ALTER TABLE content ADD COLUMN IF NOT EXISTS added_by text;
ALTER TABLE content ADD COLUMN IF NOT EXISTS verified_at timestamp;

-- =============================================
-- CAMPOS ADICIONALES (Recomendación Grok)
-- =============================================

-- Para refrescar previews automáticamente
ALTER TABLE content ADD COLUMN IF NOT EXISTS preview_last_fetched timestamp;

-- Para caching inteligente
ALTER TABLE content ADD COLUMN IF NOT EXISTS preview_etag text;

-- Para tracking de engagement real
ALTER TABLE content ADD COLUMN IF NOT EXISTS preview_views integer DEFAULT 0;

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_content_tier ON content(content_tier);
CREATE INDEX IF NOT EXISTS idx_content_quality ON content(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_content_affiliate ON content(has_affiliate);
CREATE INDEX IF NOT EXISTS idx_content_featured ON content(is_featured);
CREATE INDEX IF NOT EXISTS idx_content_preview_type ON content(preview_type);
CREATE INDEX IF NOT EXISTS idx_content_active_tier ON content(active, content_tier);

-- =============================================
-- FUNCIÓN: Incrementar views de preview
-- =============================================

CREATE OR REPLACE FUNCTION increment_preview_views(content_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE content 
  SET preview_views = preview_views + 1 
  WHERE id = content_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Promover contenido scraped a premium
-- (Recomendación Grok - auto-upgrade cuando agregas afiliado)
-- =============================================

CREATE OR REPLACE FUNCTION auto_upgrade_tier()
RETURNS TRIGGER AS $$
BEGIN
  -- Si agregaste affiliate_url, sube a premium automáticamente
  IF NEW.has_affiliate = true AND NEW.affiliate_url IS NOT NULL THEN
    NEW.content_tier := 'premium';
    NEW.quality_score := GREATEST(NEW.quality_score, 85);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-upgrade
DROP TRIGGER IF EXISTS trigger_auto_upgrade_tier ON content;
CREATE TRIGGER trigger_auto_upgrade_tier
  BEFORE UPDATE ON content
  FOR EACH ROW
  EXECUTE FUNCTION auto_upgrade_tier();

-- =============================================
-- VERIFICAR QUE TODO SE CREÓ
-- =============================================

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'content' 
AND column_name IN (
  'preview_video_url', 'preview_type', 'content_tier', 
  'has_affiliate', 'quality_score', 'preview_views'
);
