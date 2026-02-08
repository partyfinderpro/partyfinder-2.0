-- ============================================
-- VENUZ SCE FASE 1: Infraestructura Highway Algorithm - CORREGIDO
-- Tablas de configuración, caché y métricas
-- ============================================

-- 1. Configuración del Algoritmo
CREATE TABLE IF NOT EXISTS algorithm_config (
    config_key text PRIMARY KEY,
    config_value jsonb NOT NULL,
    updated_at timestamptz DEFAULT now()
);

-- Insertar configuración default
INSERT INTO algorithm_config (config_key, config_value)
VALUES 
('base_ratios', '{"eventos": 40, "clubs": 20, "soltero": 15, "shows": 15, "bares": 5, "experiencias": 5}'::jsonb),
('diversity_rules', '{"max_consecutive": 2, "exploration_pct": 10, "injection_every": 8}'::jsonb)
ON CONFLICT (config_key) DO NOTHING;

-- 2. Ciudades y Overrides
-- Nota: La tabla cities ya existe en tu DB, así que insertamos respetando columna 'country'
CREATE TABLE IF NOT EXISTS cities (
    slug text PRIMARY KEY,
    name text NOT NULL,
    country text NOT NULL DEFAULT 'MX',
    ratio_overrides jsonb,
    is_active boolean DEFAULT true
);

INSERT INTO cities (slug, name, country, ratio_overrides)
VALUES
('cdmx', 'Ciudad de México', 'MX', '{"eventos": 45, "clubs": 25}'::jsonb),
('tulum', 'Tulum', 'MX', '{"eventos": 60, "clubs": 30, "bares": 10}'::jsonb),
('cancun', 'Cancún', 'MX', '{"clubs": 40, "shows": 20}'::jsonb),
('playa-del-carmen', 'Playa del Carmen', 'MX', '{"clubs": 35, "bares": 30}'::jsonb),
('puerto-vallarta', 'Puerto Vallarta', 'MX', '{"clubs": 30, "shows": 20, "soltero": 20}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
    ratio_overrides = EXCLUDED.ratio_overrides;

-- 3. Cache del Feed (para performance crítica)
CREATE TABLE IF NOT EXISTS feed_cache (
    cache_key text PRIMARY KEY,
    city_slug text,
    category_slug text,
    items jsonb, -- Array de items pre-calculados
    item_count int,
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_feed_cache_expires ON feed_cache(expires_at);

-- 4. User Engagement (para personalización)
CREATE TABLE IF NOT EXISTS user_engagement (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id text NOT NULL,
    user_id text,
    category_slug text,
    action text, -- 'view', 'click', 'like', 'share'
    time_spent int, -- segundos
    clicked boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_engagement_device ON user_engagement(device_id);
CREATE INDEX IF NOT EXISTS idx_engagement_created ON user_engagement(created_at);

-- 5. RPCs Faltantes

-- Increment Cache Hit
CREATE OR REPLACE FUNCTION increment_cache_hit(key text)
RETURNS void AS $$
BEGIN
  -- Placeholder para futura métrica
  NULL; 
END;
$$ LANGUAGE plpgsql;

-- Get Category Counts (para UI)
CREATE OR REPLACE FUNCTION get_category_counts(p_city text)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_object_agg(category, count(*))
  INTO result
  FROM content
  WHERE (location ILIKE '%' || p_city || '%' OR p_city = 'all')
  AND active = true
  GROUP BY category;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Habilitar RLS en nuevas tablas
ALTER TABLE algorithm_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_engagement ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública
-- Usamos DO blocks para evitar errores si las políticas ya existen
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read config') THEN
        CREATE POLICY "Public read config" ON algorithm_config FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read cities') THEN
        CREATE POLICY "Public read cities" ON cities FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read cache') THEN
        CREATE POLICY "Public read cache" ON feed_cache FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Insert engagement') THEN
        CREATE POLICY "Insert engagement" ON user_engagement FOR INSERT WITH CHECK (true);
    END IF;
END $$;
