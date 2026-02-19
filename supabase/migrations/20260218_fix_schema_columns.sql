
-- === FIX RAPIDO: AGREGAR COLUMNA FALTANTE ===
ALTER TABLE public.scraped_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Asegurar que otras columnas críticas existan
ALTER TABLE public.scraped_items ADD COLUMN IF NOT EXISTS affiliate_url TEXT;
ALTER TABLE public.scraped_items ADD COLUMN IF NOT EXISTS visual_style JSONB DEFAULT '{}';
