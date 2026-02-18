-- === VEGAS STRIP BRAIN - MIGRACIÓN FINAL (Consolidada) ===

-- 1. Campo visual_style en content
ALTER TABLE public.content 
ADD COLUMN IF NOT EXISTS visual_style JSONB DEFAULT '{}';

-- 2. Tabla scraping_sources
CREATE TABLE IF NOT EXISTS public.scraping_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_url TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  affiliate_network TEXT,
  affiliate_id TEXT,
  is_active BOOLEAN DEFAULT false, -- Start inactive to check manual activation
  scrape_frequency TEXT DEFAULT 'daily',
  last_scraped_at TIMESTAMPTZ,
  next_scrape_at TIMESTAMPTZ,
  scraping_config JSONB DEFAULT '{}',
  total_items_scraped INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla scraped_items
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
  item_type TEXT,
  category TEXT,
  tags TEXT[],
  quality_score DECIMAL(5,2),
  elegance_score DECIMAL(5,2),
  vibe TEXT[],
  priority_level INTEGER DEFAULT 5,
  feed_weight DECIMAL(5,2) DEFAULT 1.0,
  is_approved BOOLEAN DEFAULT true, -- Auto approve for demo
  is_published BOOLEAN DEFAULT true, -- Auto publish for demo
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla affiliate_rules
CREATE TABLE IF NOT EXISTS public.affiliate_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  network TEXT,
  affiliate_id TEXT,
  is_active BOOLEAN DEFAULT false,
  template_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Insertar fuentes iniciales (Candy.ai)
INSERT INTO public.scraping_sources (name, base_url, category, is_active) VALUES
('Candy AI (ES)', 'https://candy.ai/es', 'ai_companion', true),
('OurDream AI', 'https://ourdream.ai', 'ai_companion', true),
('JuicyChat AI', 'https://juicychat.ai', 'webcam_ai', true)
ON CONFLICT (base_url) DO UPDATE SET is_active = true;

-- 6. Insertar reglas de afiliados (modo "trabajar gratis" por ahora)
INSERT INTO public.affiliate_rules (domain, is_active, template_url) VALUES
('candy.ai', false, 'https://candy.ai/?ref={aff_id}'),
('ourdream.ai', false, 'https://ourdream.ai/?ref={aff_id}'),
('juicychat.ai', false, 'https://juicychat.ai/?ref={aff_id}'),
('camsoda.com', false, 'https://camsoda.com/track/{aff_id}')
ON CONFLICT (domain) DO NOTHING;

-- Índices y RLS
CREATE INDEX IF NOT EXISTS idx_scraped_items_published ON public.scraped_items(is_published);
ALTER TABLE public.scraping_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraped_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agent full access sources" ON public.scraping_sources;
CREATE POLICY "Agent full access sources" ON public.scraping_sources FOR ALL USING (true);

DROP POLICY IF EXISTS "Agent full access items" ON public.scraped_items;
CREATE POLICY "Agent full access items" ON public.scraped_items FOR ALL USING (true);

DROP POLICY IF EXISTS "Agent full access rules" ON public.affiliate_rules;
CREATE POLICY "Agent full access rules" ON public.affiliate_rules FOR ALL USING (true);
