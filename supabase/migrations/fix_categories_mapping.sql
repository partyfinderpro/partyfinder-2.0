-- =====================================================
-- VENUZ - Fix de Mapeo de Categorías
-- Ejecutar en Supabase SQL Editor
-- Fecha: 5 Febrero 2026
-- =====================================================

-- PASO 1: Agregar columnas faltantes a categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS legacy_names text[] DEFAULT '{}';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_name text;

-- PASO 2: Actualizar display_name con name actual
UPDATE categories SET display_name = name WHERE display_name IS NULL;

-- PASO 3: Actualizar legacy_names para mapear strings de content.category
UPDATE categories SET legacy_names = ARRAY['club', 'clubs', 'nightclub'] WHERE slug = 'clubes-eventos';
UPDATE categories SET legacy_names = ARRAY['bar', 'bares', 'cantina', 'pub'] WHERE slug = 'bares';
UPDATE categories SET legacy_names = ARRAY['webcam', 'webcams', 'live-cams', 'cam', 'cams'] WHERE slug = 'webcams';
UPDATE categories SET legacy_names = ARRAY['evento', 'eventos', 'event', 'events', 'concierto'] WHERE slug IN ('conciertos', 'clubes-eventos');
UPDATE categories SET legacy_names = ARRAY['soltero', 'escort', 'escorts'] WHERE slug = 'servicios-adultos';
UPDATE categories SET legacy_names = ARRAY['masaje', 'masajes', 'massage'] WHERE slug = 'servicios';
UPDATE categories SET legacy_names = ARRAY['hookup', 'dating', 'citas'] WHERE slug = 'hookup-dating';
UPDATE categories SET legacy_names = ARRAY['free-tubes', 'tube', 'tubes', 'pornhub'] WHERE slug = 'free-porn-tubes';
UPDATE categories SET legacy_names = ARRAY['ai-porn', 'ai', 'deepfake'] WHERE slug = 'ai-porn';
UPDATE categories SET legacy_names = ARRAY['premium', 'paid', 'subscription'] WHERE slug = 'premium-porn';

-- PASO 4: Insertar categorías faltantes que existen en content.category
INSERT INTO categories (slug, name, display_name, legacy_names, icon, sort_order, is_active)
VALUES 
  ('restaurantes', 'Restaurantes', 'Restaurantes', ARRAY['restaurante', 'restaurantes', 'restaurant'], '🍽️', 10, true),
  ('playas', 'Playas & Beach Clubs', 'Playas', ARRAY['beach', 'playa', 'beach club', 'beach_club'], '🏖️', 11, true),
  ('social-media', 'Social Media', 'Social Media', ARRAY['Social Media', 'social media', 'social_media', 'reddit'], '📱', 12, true)
ON CONFLICT (slug) DO UPDATE SET 
  legacy_names = EXCLUDED.legacy_names,
  display_name = EXCLUDED.display_name;

-- PASO 5: Crear función para buscar category_id por legacy_name
CREATE OR REPLACE FUNCTION get_category_id_by_legacy(legacy_name text)
RETURNS uuid AS $$
DECLARE
  cat_id uuid;
BEGIN
  SELECT id INTO cat_id 
  FROM categories 
  WHERE legacy_name = ANY(legacy_names) 
     OR slug = legacy_name
     OR LOWER(slug) = LOWER(legacy_name)
  LIMIT 1;
  RETURN cat_id;
END;
$$ LANGUAGE plpgsql;

-- PASO 6: Migrar content.category a category_id
-- Primero verificar que category_id existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'category_id') THEN
    ALTER TABLE content ADD COLUMN category_id uuid REFERENCES categories(id);
  END IF;
END $$;

-- PASO 7: Actualizar category_id basado en category string
UPDATE content c
SET category_id = (
  SELECT cat.id 
  FROM categories cat 
  WHERE c.category = ANY(cat.legacy_names) 
     OR c.category = cat.slug 
     OR LOWER(c.category) = LOWER(cat.slug)
  LIMIT 1
)
WHERE c.category_id IS NULL AND c.category IS NOT NULL;

-- PASO 8: Actualizar sort_order
UPDATE categories SET sort_order = 1 WHERE slug = 'webcams';
UPDATE categories SET sort_order = 2 WHERE slug = 'clubes-eventos';
UPDATE categories SET sort_order = 3 WHERE slug = 'servicios-adultos';
UPDATE categories SET sort_order = 4 WHERE slug = 'bares';
UPDATE categories SET sort_order = 5 WHERE slug = 'hookup-dating';
UPDATE categories SET sort_order = 6 WHERE slug = 'free-porn-tubes';
UPDATE categories SET sort_order = 7 WHERE slug = 'premium-porn';
UPDATE categories SET sort_order = 8 WHERE slug = 'ai-porn';
UPDATE categories SET sort_order = 9 WHERE slug = 'restaurantes';
UPDATE categories SET sort_order = 10 WHERE slug = 'playas';
UPDATE categories SET sort_order = 11 WHERE slug = 'social-media';

-- PASO 9: Verificar migración
SELECT 
  cat.slug,
  cat.display_name,
  cat.legacy_names,
  COUNT(c.id) as total_content
FROM categories cat
LEFT JOIN content c ON c.category_id = cat.id
GROUP BY cat.id, cat.slug, cat.display_name, cat.legacy_names
ORDER BY total_content DESC;
