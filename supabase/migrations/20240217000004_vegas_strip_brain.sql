-- 20240217000004_vegas_strip_brain.sql
-- Infraestructura del Super Cerebro "Las Vegas Strip"
-- Habilita scraping inteligente, visual style y gestión de fuentes

-- 1. Añadir visual_style a tabla content (para Neon Filter y Slots)
ALTER TABLE public.content 
ADD COLUMN IF NOT EXISTS visual_style JSONB DEFAULT '{}';

-- 2. Tabla scraping_sources (Fuentes confiables)
CREATE TABLE IF NOT EXISTS public.scraping_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_url TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  affiliate_network TEXT,
  affiliate_id TEXT,
  is_active BOOLEAN DEFAULT true,
  scrape_frequency TEXT DEFAULT 'daily',
  last_scraped_at TIMESTAMPTZ,
  next_scrape_at TIMESTAMPTZ,
  scraping_config JSONB DEFAULT '{}',
  total_items_scraped INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla scraped_items (Staging Area del Cerebro)
CREATE TABLE IF NOT EXISTS public.scraped_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES public.scraping_sources(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  rewritten_title TEXT,
  description TEXT,
  rewritten_description TEXT,
  original_url TEXT NOT NULL,
  affiliate_url TEXT,
  hero_image_url TEXT,
  gallery_urls TEXT[],
  item_type TEXT, -- banner, model, product, venue
  category TEXT,
  tags TEXT[],
  quality_score DECIMAL(5,2),
  elegance_score DECIMAL(5,2),
  vibe TEXT[], -- high_energy, chill_seductive, digital_fantasy
  priority_level INTEGER DEFAULT 5,
  feed_weight DECIMAL(5,2) DEFAULT 1.0,
  is_approved BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para velocidad de consulta del Agente
CREATE INDEX IF NOT EXISTS idx_scraped_items_priority ON public.scraped_items(priority_level DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_items_published ON public.scraped_items(is_published);
CREATE INDEX IF NOT EXISTS idx_scraped_items_source ON public.scraped_items(source_id);

-- RLS (Seguridad para Agente/Admin)
ALTER TABLE public.scraping_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraped_items ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para el service_role (el agente)
DROP POLICY IF EXISTS "Agent full access sources" ON public.scraping_sources;
CREATE POLICY "Agent full access sources" ON public.scraping_sources FOR ALL USING (true);

DROP POLICY IF EXISTS "Agent full access items" ON public.scraped_items;
CREATE POLICY "Agent full access items" ON public.scraped_items FOR ALL USING (true);
