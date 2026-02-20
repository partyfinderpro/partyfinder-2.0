-- ============================================================
-- VENUZ – Vegas Strip Algorithm Tables
-- Fecha: 2026-02-19
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- 1. SCRAPING_SOURCES — Sitios a scrapear
-- ============================================================
CREATE TABLE IF NOT EXISTS public.scraping_sources (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                  TEXT NOT NULL,
  base_url              TEXT NOT NULL UNIQUE,
  category              TEXT NOT NULL, -- 'ai_companion','webcam_ai','sexdoll','events','casino','nightclub'
  priority              INTEGER DEFAULT 5, -- 1-10
  is_active             BOOLEAN DEFAULT true,
  scrape_frequency      TEXT DEFAULT 'daily', -- 'hourly','daily','weekly'
  last_scraped_at       TIMESTAMPTZ,
  next_scrape_at        TIMESTAMPTZ,
  scraping_config       JSONB DEFAULT '{}', -- CSS selectors específicos del sitio
  -- Afiliado pendiente/activo
  affiliate_id          TEXT,   -- tu código: ej. 'pv123'
  affiliate_approved    BOOLEAN DEFAULT false,
  -- Métricas
  total_items_scraped   INTEGER DEFAULT 0,
  successful_scrapes    INTEGER DEFAULT 0,
  failed_scrapes        INTEGER DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. SCRAPED_ITEMS — Contenido extraído (banners, modelos, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.scraped_items (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id              UUID REFERENCES public.scraping_sources(id) ON DELETE CASCADE,
  -- Datos originales
  title                  TEXT NOT NULL,
  description            TEXT,
  original_url           TEXT NOT NULL,
  affiliate_url          TEXT,   -- URL con tu ID de afiliado (vacío hasta aprobación)
  -- Media
  hero_image_url         TEXT,
  gallery_urls           TEXT[]  DEFAULT '{}',
  video_url              TEXT,
  -- Clasificación
  item_type              TEXT DEFAULT 'model', -- 'banner','model','product','event'
  category               TEXT,
  vibe                   TEXT[]  DEFAULT '{}', -- ['high_energy','chill_seductive','digital_fantasy']
  tags                   TEXT[]  DEFAULT '{}',
  -- Visual
  visual_style           JSONB   DEFAULT '{}', -- {className, neonColor, cssFilter}
  -- Puntuaciones IA
  quality_score          DECIMAL(4,2) DEFAULT 5.0,  -- 0-10
  elegance_score         DECIMAL(4,2) DEFAULT 5.0,  -- 0-10 (10 = no vulgar / elegante)
  trending_score         DECIMAL(5,2) DEFAULT 50.0, -- 0-100
  -- Reescritura LLM
  rewritten_title        TEXT,
  rewritten_description  TEXT,
  is_rewritten           BOOLEAN DEFAULT false,
  -- Priorización y visibilidad
  priority_level         INTEGER DEFAULT 5, -- 1-10
  feed_weight            DECIMAL(3,2) DEFAULT 1.0,
  visibility_schedule    TEXT DEFAULT 'anytime', -- 'anytime','night_only','weekend'
  -- Flujo de aprobación (manual o auto)
  is_approved            BOOLEAN DEFAULT false,
  is_published           BOOLEAN DEFAULT false,
  -- Metadata técnica
  scrape_metadata        JSONB DEFAULT '{}',
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. AFFILIATE_RULES — Reglas para LinkTransformer
-- ============================================================
CREATE TABLE IF NOT EXISTS public.affiliate_rules (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain        TEXT NOT NULL UNIQUE, -- ej: 'candy.ai'
  affiliate_id  TEXT NOT NULL,        -- tu ID en ese programa
  template_url  TEXT NOT NULL,        -- cómo construir el link: 'https://candy.ai/ref/{aff_id}'
  is_active     BOOLEAN DEFAULT false, -- false hasta que te aprueben
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_scraped_items_source    ON public.scraped_items(source_id);
CREATE INDEX IF NOT EXISTS idx_scraped_items_category  ON public.scraped_items(category);
CREATE INDEX IF NOT EXISTS idx_scraped_items_priority  ON public.scraped_items(priority_level DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_items_published ON public.scraped_items(is_published, is_approved);
CREATE INDEX IF NOT EXISTS idx_scraped_items_vibe      ON public.scraped_items USING gin(vibe);
CREATE INDEX IF NOT EXISTS idx_scraped_items_schedule  ON public.scraped_items(visibility_schedule);
CREATE INDEX IF NOT EXISTS idx_affiliate_rules_domain  ON public.affiliate_rules(domain);
CREATE INDEX IF NOT EXISTS idx_scraping_sources_active ON public.scraping_sources(is_active);

-- ============================================================
-- TRIGGERS — updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_scraped_items_updated_at ON public.scraped_items;
CREATE TRIGGER trg_scraped_items_updated_at
  BEFORE UPDATE ON public.scraped_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_scraping_sources_updated_at ON public.scraping_sources;
CREATE TRIGGER trg_scraping_sources_updated_at
  BEFORE UPDATE ON public.scraping_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- VISTA: items listos para el feed
-- ============================================================
CREATE OR REPLACE VIEW public.feed_ready_items AS
SELECT
  si.*,
  ss.name            AS source_name,
  ss.affiliate_id    AS source_affiliate_id,
  ss.affiliate_approved,
  -- ¿Es visible ahora según horario?
  CASE
    WHEN si.visibility_schedule = 'night_only'
    THEN (EXTRACT(HOUR FROM NOW() AT TIME ZONE 'America/Mexico_City') >= 20
          OR EXTRACT(HOUR FROM NOW() AT TIME ZONE 'America/Mexico_City') < 6)
    WHEN si.visibility_schedule = 'weekend'
    THEN EXTRACT(DOW FROM NOW()) IN (0, 5, 6)
    ELSE true
  END AS is_currently_visible
FROM public.scraped_items si
JOIN public.scraping_sources ss ON si.source_id = ss.id
WHERE si.is_published = true
  AND si.is_approved  = true
  AND ss.is_active    = true;

-- ============================================================
-- RLS (Row Level Security) — Solo service_role escribe
-- ============================================================
ALTER TABLE public.scraping_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraped_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_rules  ENABLE ROW LEVEL SECURITY;

-- Service role (agente/cron) puede todo
CREATE POLICY "service_role_all_scraping_sources"
  ON public.scraping_sources FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_scraped_items"
  ON public.scraped_items    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_affiliate_rules"
  ON public.affiliate_rules  FOR ALL USING (auth.role() = 'service_role');

-- Lectura pública en items aprobados/publicados (para el feed)
CREATE POLICY "public_read_published_items"
  ON public.scraped_items FOR SELECT USING (is_published = true AND is_approved = true);

-- ============================================================
-- SEED — Fuentes iniciales + Reglas de afiliado
-- ============================================================
INSERT INTO public.scraping_sources (name, base_url, category, priority, scraping_config)
VALUES
  ('Candy AI',      'https://candy.ai/es',         'ai_companion', 9,
   '{"cardSelector": ".model-card, [class*=ModelCard], article"}'::jsonb),
  ('OurDream AI',   'https://ourdream.ai',          'ai_companion', 8,
   '{"cardSelector": ".companion-card, [class*=companion]"}'::jsonb),
  ('JuicyChat AI',  'https://www.juicychat.ai',     'webcam_ai',    8,
   '{"cardSelector": ".character-list li, [class*=character]"}'::jsonb),
  ('CamsodaAI',     'https://camsoda.ai',           'webcam_ai',    7,
   '{"cardSelector": ".model-grid div, [class*=live]"}'::jsonb),
  ('Rosemary Doll', 'https://www.rosemarydoll.com', 'sexdoll',      7,
   '{"cardSelector": ".product-card, .product-item, article"}'::jsonb)
ON CONFLICT (base_url) DO NOTHING;

-- Reglas de afiliado (is_active=false hasta que te aprueben → solo cambia ese campo)
INSERT INTO public.affiliate_rules (domain, affiliate_id, template_url, is_active, notes)
VALUES
  ('candy.ai',         'PENDING', 'https://candy.ai/?ref={aff_id}',              false, 'Solicitar en: candy.ai/affiliates'),
  ('ourdream.ai',      'PENDING', 'https://ourdream.ai/?ref={aff_id}',           false, 'Solicitar en su web'),
  ('juicychat.ai',     'PENDING', 'https://www.juicychat.ai/?ref={aff_id}',      false, 'Solicitar en su web'),
  ('camsoda.ai',       'PENDING', 'https://camsoda.ai/?ref={aff_id}',            false, 'Solicitar en su web'),
  ('rosemarydoll.com', 'PENDING', 'https://www.rosemarydoll.com/?aff={aff_id}',  false, 'Solicitar en su web')
ON CONFLICT (domain) DO NOTHING;
