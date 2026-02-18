-- === VEGAS STRIP - MIGRACIÓN FINAL (ejecuta esto ahora) ===

-- 1. Habilitar extensión si no existe (necesario para uuid_generate_v4)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Modificar tabla content
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS visual_style JSONB DEFAULT '{}';

-- 3. Crear tabla scraping_sources
CREATE TABLE IF NOT EXISTS public.scraping_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  base_url TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Crear tabla scraped_items
CREATE TABLE IF NOT EXISTS public.scraped_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID REFERENCES public.scraping_sources(id),
  title TEXT,
  rewritten_title TEXT,
  description TEXT,
  rewritten_description TEXT,
  original_url TEXT, -- Nota: Sin UNIQUE constraint estricto por ahora, se maneja por lógica de negocio si es necesario
  affiliate_url TEXT,
  hero_image_url TEXT,
  gallery_urls TEXT[],
  item_type TEXT,
  category TEXT,
  tags TEXT[],
  quality_score DECIMAL(3,2),
  elegance_score DECIMAL(3,2),
  vibe TEXT[],
  priority_level INTEGER DEFAULT 5,
  is_approved BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Crear tabla affiliate_rules
CREATE TABLE IF NOT EXISTS public.affiliate_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT false,
  template_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Insertar fuentes iniciales
INSERT INTO public.scraping_sources (name, base_url, category) VALUES
('Candy AI', 'https://candy.ai/es', 'ai_companion'),
('OurDream AI', 'https://ourdream.ai', 'ai_companion'),
('JuicyChat AI', 'https://juicychat.ai', 'webcam_ai'),
('Camsoda AI', 'https://camsoda.ai', 'webcam_ai'),
('Rosemary Doll', 'https://rosemarydoll.com', 'sexdoll')
ON CONFLICT (base_url) DO NOTHING;
