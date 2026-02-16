-- Nombre: enhance_affiliate_links
-- Descripción: Mejoras en tabla affiliate_links para Affiliate Intelligence Engine

-- 1. Añadir columnas de inteligencia
ALTER TABLE public.affiliate_links 
  ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS intent_tags TEXT[] DEFAULT '{}', -- ej: '{party, adult, luxury}'
  ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0, -- Mayor prioridad = se muestra antes
  ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_clicked_at TIMESTAMP;

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_affiliate_venue ON public.affiliate_links(venue_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_intent ON public.affiliate_links USING GIN(intent_tags);

-- 3. Función RPC para incrementar clicks (atómica)
CREATE OR REPLACE FUNCTION increment_affiliate_click(link_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.affiliate_links
  SET 
    click_count = click_count + 1,
    last_clicked_at = NOW()
  WHERE id = link_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN public.affiliate_links.intent_tags IS 'Tags de intención de usuario para matching inteligente (ej: party, chill)';
