-- ============================================================
-- VENUZ – MASTER FIX (seguro contra cualquier estado de BD)
-- Pega TODO esto en Supabase SQL Editor y dale Run
-- ============================================================

-- ============================================================
-- FIX 1: dev_tasks — policy ya existente
-- ============================================================
DROP POLICY IF EXISTS "service_role_full_access_tasks" ON public.dev_tasks;

-- Recrear solo si la tabla existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'dev_tasks') THEN
    -- RLS
    ALTER TABLE public.dev_tasks ENABLE ROW LEVEL SECURITY;
    -- Policy limpia
    DROP POLICY IF EXISTS "service_role_full_access_tasks" ON public.dev_tasks;
    CREATE POLICY "service_role_full_access_tasks" 
      ON public.dev_tasks FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- FIX 2: scraping_sources — agregar columnas faltantes PRIMERO
-- antes de cualquier INSERT
-- ============================================================
ALTER TABLE public.scraping_sources
  ADD COLUMN IF NOT EXISTS priority              INTEGER     DEFAULT 5,
  ADD COLUMN IF NOT EXISTS scraping_config       JSONB       DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS affiliate_id          TEXT,
  ADD COLUMN IF NOT EXISTS affiliate_approved    BOOLEAN     DEFAULT false,
  ADD COLUMN IF NOT EXISTS total_items_scraped   INTEGER     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS successful_scrapes    INTEGER     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failed_scrapes        INTEGER     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_scrape_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at            TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- FIX 3: scraped_items — agregar columnas faltantes
-- ============================================================
ALTER TABLE public.scraped_items
  ADD COLUMN IF NOT EXISTS vibe                  TEXT[]       DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS visual_style          JSONB        DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS elegance_score        DECIMAL(4,2) DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS trending_score        DECIMAL(5,2) DEFAULT 50.0,
  ADD COLUMN IF NOT EXISTS feed_weight           DECIMAL(3,2) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS visibility_schedule   TEXT         DEFAULT 'anytime',
  ADD COLUMN IF NOT EXISTS item_type             TEXT         DEFAULT 'model',
  ADD COLUMN IF NOT EXISTS affiliate_url         TEXT,
  ADD COLUMN IF NOT EXISTS hero_image_url        TEXT,
  ADD COLUMN IF NOT EXISTS gallery_urls          TEXT[]       DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS video_url             TEXT,
  ADD COLUMN IF NOT EXISTS tags                  TEXT[]       DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rewritten_title       TEXT,
  ADD COLUMN IF NOT EXISTS rewritten_description TEXT,
  ADD COLUMN IF NOT EXISTS is_rewritten          BOOLEAN      DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_approved           BOOLEAN      DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_published          BOOLEAN      DEFAULT false,
  ADD COLUMN IF NOT EXISTS priority_level        INTEGER      DEFAULT 5,
  ADD COLUMN IF NOT EXISTS quality_score         DECIMAL(4,2) DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS scrape_metadata       JSONB        DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at            TIMESTAMPTZ  DEFAULT NOW();

-- ============================================================
-- FIX 4: affiliate_rules — crear si no existe
-- ============================================================
CREATE TABLE IF NOT EXISTS public.affiliate_rules (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain        TEXT NOT NULL UNIQUE,
  affiliate_id  TEXT NOT NULL,
  template_url  TEXT NOT NULL,
  is_active     BOOLEAN DEFAULT false,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FIX 5: Índices seguros
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_scraped_items_schedule  ON public.scraped_items(visibility_schedule);
CREATE INDEX IF NOT EXISTS idx_scraped_items_vibe      ON public.scraped_items USING gin(vibe);
CREATE INDEX IF NOT EXISTS idx_scraped_items_published ON public.scraped_items(is_published, is_approved);
CREATE INDEX IF NOT EXISTS idx_scraped_items_priority  ON public.scraped_items(priority_level DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_rules_domain  ON public.affiliate_rules(domain);
CREATE INDEX IF NOT EXISTS idx_scraping_sources_active ON public.scraping_sources(is_active);

-- ============================================================
-- FIX 6: Función + Triggers updated_at
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
-- FIX 7: Vista feed_ready_items (DROP + CREATE para actualizar)
-- ============================================================
DROP VIEW IF EXISTS public.feed_ready_items;
CREATE VIEW public.feed_ready_items AS
SELECT
  si.*,
  ss.name              AS source_name,
  ss.affiliate_id      AS source_affiliate_id,
  ss.affiliate_approved,
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
-- FIX 8: Seed — fuentes (ahora priority ya existe, es seguro)
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
ON CONFLICT (base_url) DO UPDATE
  SET scraping_config = EXCLUDED.scraping_config,
      priority        = EXCLUDED.priority;

-- ============================================================
-- FIX 9: Seed — reglas de afiliado
-- ============================================================
INSERT INTO public.affiliate_rules (domain, affiliate_id, template_url, is_active, notes)
VALUES
  ('candy.ai',         'PENDING', 'https://candy.ai/?ref={aff_id}',             false, 'Solicitar: candy.ai/affiliates'),
  ('ourdream.ai',      'PENDING', 'https://ourdream.ai/?ref={aff_id}',          false, 'Solicitar en su web'),
  ('juicychat.ai',     'PENDING', 'https://www.juicychat.ai/?ref={aff_id}',     false, 'Solicitar en su web'),
  ('camsoda.ai',       'PENDING', 'https://camsoda.ai/?ref={aff_id}',           false, 'Solicitar en su web'),
  ('rosemarydoll.com', 'PENDING', 'https://www.rosemarydoll.com/?aff={aff_id}', false, 'Solicitar en su web')
ON CONFLICT (domain) DO NOTHING;

-- ============================================================
-- VERIFICACIÓN FINAL — debe mostrar las tablas y sus columnas
-- ============================================================
SELECT 
  table_name, 
  COUNT(*) as columnas
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('scraping_sources', 'scraped_items', 'affiliate_rules', 'dev_tasks')
GROUP BY table_name
ORDER BY table_name;
