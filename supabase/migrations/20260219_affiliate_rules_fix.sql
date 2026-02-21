-- Fix rápido: agregar columnas faltantes en affiliate_rules
ALTER TABLE public.affiliate_rules
  ADD COLUMN IF NOT EXISTS notes       TEXT,
  ADD COLUMN IF NOT EXISTS template_url TEXT,
  ADD COLUMN IF NOT EXISTS is_active   BOOLEAN DEFAULT false;

-- Ahora re-insertar el seed
INSERT INTO public.affiliate_rules (domain, affiliate_id, template_url, is_active, notes)
VALUES
  ('candy.ai',         'PENDING', 'https://candy.ai/?ref={aff_id}',             false, 'Solicitar: candy.ai/affiliates'),
  ('ourdream.ai',      'PENDING', 'https://ourdream.ai/?ref={aff_id}',          false, 'Solicitar en su web'),
  ('juicychat.ai',     'PENDING', 'https://www.juicychat.ai/?ref={aff_id}',     false, 'Solicitar en su web'),
  ('camsoda.ai',       'PENDING', 'https://camsoda.ai/?ref={aff_id}',           false, 'Solicitar en su web'),
  ('rosemarydoll.com', 'PENDING', 'https://www.rosemarydoll.com/?aff={aff_id}', false, 'Solicitar en su web')
ON CONFLICT (domain) DO UPDATE
  SET template_url = EXCLUDED.template_url,
      notes        = EXCLUDED.notes;

-- Verificación
SELECT table_name, COUNT(*) as columnas
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('scraping_sources', 'scraped_items', 'affiliate_rules', 'dev_tasks')
GROUP BY table_name
ORDER BY table_name;
