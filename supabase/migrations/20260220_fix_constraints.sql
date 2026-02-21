-- 1. Limpiar duplicados en scraped_items.original_url (mantener el más reciente)
WITH duplicates AS (
  SELECT id, original_url, ROW_NUMBER() OVER (PARTITION BY original_url ORDER BY created_at DESC) AS rn
  FROM public.scraped_items
)
DELETE FROM public.scraped_items
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- 2. Agregar UNIQUE constraint en original_url (si no existe)
ALTER TABLE public.scraped_items
ADD CONSTRAINT scraped_items_original_url_unique UNIQUE (original_url);

-- 3. Confirmar/add visual_style JSONB (si no existe)
ALTER TABLE public.scraped_items
ADD COLUMN IF NOT EXISTS visual_style JSONB DEFAULT '{}';

-- 4. Refrescar schema cache de PostgREST
NOTIFY pgrst, 'reload schema';
