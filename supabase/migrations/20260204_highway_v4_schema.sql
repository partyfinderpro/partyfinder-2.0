-- =============================================
-- THE HIGHWAY ALGORITHM v4.0 - SCHEMA MIGRATION
-- =============================================

-- Rename existing 'escort' category if exists (part of the rebranding to 'soltero')
UPDATE content SET category = 'soltero' WHERE category = 'escort';
UPDATE categories SET name = 'Estoy Soltero', slug = 'soltero' WHERE slug = 'escort';

-- 1. CIUDADES
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_km INTEGER DEFAULT 50,
  population INTEGER,
  ratio_overrides JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed inicial
INSERT INTO cities (name, slug, lat, lng, population) VALUES
('Ciudad de México', 'cdmx', 19.4326, -99.1332, 22000000),
('Guadalajara', 'gdl', 20.6597, -103.3496, 5500000),
('Puerto Vallarta', 'vallarta', 20.6534, -105.2253, 350000),
('Monterrey', 'mty', 25.6866, -100.3161, 5300000),
('Cancún', 'cancun', 21.1619, -86.8515, 900000)
ON CONFLICT (slug) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng;

-- 2. CATEGORÍAS (Update or Create)
-- First ensure table exists if not already there from previous migrations
CREATE TABLE IF NOT EXISTS categories_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  color TEXT,
  weight_base DECIMAL DEFAULT 0.2,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

-- Note: The original generic schema.sql had a categories table.
-- Let's check if we should migrate or just use a new one for v4.
-- For v4 implementation, we'll ensure these categories exist in whichever table is active.
INSERT INTO categories_new (name, slug, icon, color, weight_base, sort_order) VALUES
('Eventos', 'eventos', '🎉', '#FF6B6B', 0.25, 1),
('Clubs', 'clubs', '🎵', '#9B59B6', 0.20, 2),
('Estoy Soltero', 'soltero', '💝', '#E91E63', 0.25, 3),
('Bares', 'bares', '🍺', '#F39C12', 0.15, 4),
('Shows', 'shows', '🎭', '#3498DB', 0.10, 5),
('Experiencias', 'experiencias', '✨', '#1ABC9C', 0.05, 6)
ON CONFLICT (slug) DO UPDATE SET
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  weight_base = EXCLUDED.weight_base;

-- 3. CONTENIDO (Adding metric columns)
ALTER TABLE content ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE content ADD COLUMN IF NOT EXISTS clicks_count INTEGER DEFAULT 0;
ALTER TABLE content ADD COLUMN IF NOT EXISTS avg_time_spent DECIMAL DEFAULT 0;
ALTER TABLE content ADD COLUMN IF NOT EXISTS completion_rate DECIMAL DEFAULT 0;
ALTER TABLE content ADD COLUMN IF NOT EXISTS trending_score DECIMAL DEFAULT 0;
ALTER TABLE content ADD COLUMN IF NOT EXISTS days_until_event INTEGER;
ALTER TABLE content ADD COLUMN IF NOT EXISTS last_served_at TIMESTAMPTZ;

-- 4. ENGAGEMENT DE USUARIO
CREATE TABLE IF NOT EXISTS user_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,  -- NULL para anónimos (usa device_id)
  device_id TEXT,
  item_id UUID REFERENCES content(id),
  category_slug TEXT,
  time_spent INTEGER DEFAULT 0,
  completion_pct DECIMAL DEFAULT 0,
  clicked BOOLEAN DEFAULT false,
  saved BOOLEAN DEFAULT false,
  shared BOOLEAN DEFAULT false,
  skipped BOOLEAN DEFAULT false,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(device_id, item_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_engagement_user ON user_engagement(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_engagement_device ON user_engagement(device_id, created_at);
CREATE INDEX IF NOT EXISTS idx_engagement_category ON user_engagement(category_slug, created_at);

-- 5. CACHE DE FEEDS
CREATE TABLE IF NOT EXISTS feed_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE,
  city_slug TEXT,
  category_slug TEXT,
  items JSONB,
  item_count INTEGER,
  expires_at TIMESTAMPTZ,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cache_key ON feed_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON feed_cache(expires_at);

-- 6. CONFIGURACIÓN DE RATIOS
CREATE TABLE IF NOT EXISTS algorithm_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE,
  config_value JSONB,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO algorithm_config (config_key, config_value, description) VALUES
('base_ratios', '{"eventos":25,"clubs":20,"soltero":25,"bares":15,"shows":10,"experiencias":5}', 'Proporciones base del feed'),
('hour_modifiers', '{"morning":{"eventos":-5,"bares":10},"evening":{"clubs":10,"soltero":10}}', 'Ajustes por hora'),
('day_modifiers', '{"friday":{"eventos":15,"clubs":10},"saturday":{"clubs":15}}', 'Ajustes por día'),
('diversity_rules', '{"max_consecutive":2,"exploration_pct":10,"injection_every":8}', 'Reglas de diversidad')
ON CONFLICT (config_key) DO NOTHING;

-- RPC for incrementing cache hit
CREATE OR REPLACE FUNCTION increment_cache_hit(key TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE feed_cache SET hit_count = hit_count + 1 WHERE cache_key = key;
END;
$$ LANGUAGE plpgsql;

-- RPC for updating item stats
CREATE OR REPLACE FUNCTION update_item_stats(p_item_id UUID, p_time_spent INTEGER, p_clicked BOOLEAN)
RETURNS VOID AS $$
BEGIN
  UPDATE content SET 
    views_count = views_count + 1,
    avg_time_spent = (avg_time_spent * views_count + p_time_spent) / (views_count + 1),
    clicks_count = clicks_count + (CASE WHEN p_clicked THEN 1 ELSE 0 END)
  WHERE id = p_item_id;
END;
$$ LANGUAGE plpgsql;
