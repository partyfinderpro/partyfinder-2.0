-- =====================================================
-- VENUZ Vegas Strip: Fix user_intents + visual_style
-- Fecha: 2026-02-19
-- =====================================================

-- 1. DROP tabla vieja si tenía schema equivocado (adult_score, party_score, job_score)
DROP TABLE IF EXISTS public.user_intents;

-- 2. Crear con el schema EXACTO que highwayAlgorithm.ts espera
--    NOTA: intent_score es DECIMAL (0.0 a 1.0), NO integer
CREATE TABLE public.user_intents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,  -- TEXT para soportar anónimos (anon_xxxx, user_xxxx)
  intent_score DECIMAL(4,3) DEFAULT 0.5,  -- Float 0.0 a 1.0 (fórmula cuadrática)
  initial_referrer TEXT DEFAULT 'direct',
  likes_job INTEGER DEFAULT 0,
  likes_event INTEGER DEFAULT 0,
  likes_adult INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  lat DECIMAL(9,6),
  lng DECIMAL(9,6),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índice por user_id (búsqueda frecuente)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_intents_user_unique ON public.user_intents(user_id);

-- 4. RLS (abierto temporalmente para anónimos, restringir después con auth)
ALTER TABLE public.user_intents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Temporal full access" ON public.user_intents;
CREATE POLICY "Temporal full access" ON public.user_intents FOR ALL USING (true);

-- 5. Fix visual_style en content existente (evitar NULLs que rompen JSON parse)
UPDATE public.content SET visual_style = '{}' WHERE visual_style IS NULL;
UPDATE public.content SET visual_style = '{}' WHERE visual_style::text = 'null';

-- 6. Asegurar que content.source_url tiene constraint UNIQUE para upserts
-- (puede fallar si ya existe, por eso usamos DO block)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'content'
        AND indexname = 'idx_content_source_url_unique'
    ) THEN
        -- Intentar crear constraint, ignorar si hay duplicados
        BEGIN
            CREATE UNIQUE INDEX idx_content_source_url_unique ON public.content(source_url)
            WHERE source_url IS NOT NULL AND source_url != '';
        EXCEPTION WHEN unique_violation THEN
            RAISE NOTICE 'Cannot create unique index on source_url: duplicates exist. Skipping.';
        END;
    END IF;
END
$$;
