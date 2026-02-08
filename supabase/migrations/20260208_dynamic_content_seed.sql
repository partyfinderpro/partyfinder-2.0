-- ============================================
-- VENUZ - DYNAMIC CONTENT SEED / UPDATE SCRIPT
-- Execute this AFTER 20260208_dynamic_content_updates.sql
-- ============================================

-- 1. Actualizar contenido de tipo 'club' con videos de muestra
-- Usando videos genéricos de fiesta para demostración
UPDATE content 
SET 
  preview_type = 'video',
  preview_video_url = 'https://cdn.pixabay.com/vimeo/328940142/party-23296.mp4?width=1280&hash=d85250495333068565251662998782343715c0e0', -- CC0 Party Video
  content_tier = 'verified',
  quality_score = 90,
  is_featured = true
WHERE 
  category = 'club' 
  AND (preview_video_url IS NULL OR preview_video_url = '')
  AND active = true
LIMIT 5;

-- 2. Actualizar contenido de 'webcam' / 'soltero'
-- Simulando contenido premium
UPDATE content 
SET 
  preview_type = 'image', -- Fallback seguro si no hay video real
  content_tier = 'premium',
  has_affiliate = true,
  quality_score = 95,
  priority_boost = 1.5
WHERE 
  category IN ('webcam', 'soltero')
LIMIT 10;

-- 3. Crear configuración del Algoritmo Highway (Defaults)
INSERT INTO algorithm_config (config_key, config_value)
VALUES 
  ('base_ratios', '{"eventos": 25, "clubs": 20, "soltero": 25, "bares": 15, "shows": 10, "experiencias": 5}'::jsonb),
  ('hour_modifiers', '{
    "morning": {"experiencias": 20, "clubs": -10}, 
    "afternoon": {"bares": 10, "eventos": 10}, 
    "evening": {"clubs": 20, "shows": 10}, 
    "latenight": {"soltero": 20, "clubs": 10}
  }'::jsonb),
  ('diversity_rules', '{"max_consecutive": 2, "exploration_pct": 15}'::jsonb)
ON CONFLICT (config_key) DO NOTHING;

-- 4. Crear ciudades base
INSERT INTO cities (slug, name, country)
VALUES
  ('puerto-vallarta', 'Puerto Vallarta', 'MX'),
  ('cdmx', 'Ciudad de México', 'MX'),
  ('guadalajara', 'Guadalajara', 'MX'),
  ('medellin', 'Medellín', 'CO')
ON CONFLICT (slug) DO NOTHING;
