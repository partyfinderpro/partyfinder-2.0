-- 20240217000005_affiliate_rules.sql
-- Motor de Reglas de Afiliados
-- Permite transformar links "working for free" en "monetized" con un switch

CREATE TABLE IF NOT EXISTS public.affiliate_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,           -- ej: "candy.ai"
  network TEXT,                          -- "crakrevenue", "shareasale", etc.
  affiliate_id TEXT,                     -- tu ID de afiliado
  is_active BOOLEAN DEFAULT false,       -- activar cuando te aprueben
  template_url TEXT,                     -- ej: "https://candy.ai/?ref={aff_id}"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar ejemplos iniciales (puedes agregar más después)
INSERT INTO public.affiliate_rules (domain, network, affiliate_id, is_active, template_url) VALUES
('candy.ai', 'custom', 'TU_AFF_ID_AQUI', false, 'https://candy.ai/?ref={aff_id}'),
('ourdream.ai', 'custom', 'TU_AFF_ID_AQUI', false, 'https://ourdream.ai/?ref={aff_id}'),
('juicychat.ai', 'custom', 'TU_AFF_ID_AQUI', false, 'https://juicychat.ai/?ref={aff_id}'),
('camsoda.com', 'custom', 'TU_AFF_ID_AQUI', false, 'https://camsoda.com/track/{aff_id}'),
('rosemarydoll.com', 'custom', 'TU_AFF_ID_AQUI', false, 'https://rosemarydoll.com/?ref={aff_id}')
ON CONFLICT (domain) DO UPDATE SET
    template_url = EXCLUDED.template_url;

-- RLS
ALTER TABLE public.affiliate_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Agent full access rules" ON public.affiliate_rules;
CREATE POLICY "Agent full access rules" ON public.affiliate_rules FOR ALL USING (true);
