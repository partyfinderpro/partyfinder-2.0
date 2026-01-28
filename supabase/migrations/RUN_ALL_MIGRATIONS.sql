-- ============================================
-- VENUZ ALL-IN-ONE MIGRATION SCRIPT
-- Copy and paste this ENTIRE file into Supabase SQL Editor
-- Date: 2026-01-27
-- ============================================

-- ⚠️ BACKUP YOUR DATABASE BEFORE RUNNING THIS!

BEGIN;

-- ============ MIGRATION 001: ADD MISSING FIELDS ============

ALTER TABLE content ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE content ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE content ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE content ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE content ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
ALTER TABLE content ADD COLUMN IF NOT EXISTS is_open_now BOOLEAN DEFAULT NULL;
ALTER TABLE content ADD COLUMN IF NOT EXISTS open_until VARCHAR(50);
ALTER TABLE content ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE content ADD COLUMN IF NOT EXISTS address VARCHAR(500);
ALTER TABLE content ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE content ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT NULL;
ALTER TABLE content ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE content ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE content ADD COLUMN IF NOT EXISTS distance_km DECIMAL(6,2);
ALTER TABLE content ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_content_updated_at ON content;
CREATE TRIGGER update_content_updated_at
    BEFORE UPDATE ON content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Populate category from FK
UPDATE content c
SET category = cat.name
FROM categories cat
WHERE c.category_id = cat.id
AND c.category IS NULL;

-- Populate location from FK
UPDATE content c
SET location = r.name
FROM regions r
WHERE c.region_id = r.id
AND c.location IS NULL;

-- Copy coordinates from regions
UPDATE content c
SET latitude = r.latitude, longitude = r.longitude
FROM regions r
WHERE c.region_id = r.id
AND c.latitude IS NULL;

RAISE NOTICE '✅ Migration 001 complete: Added missing fields';

-- ============ MIGRATION 002: GEO INDEXES ============

CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE content ADD COLUMN IF NOT EXISTS geo_point geography(POINT, 4326);

UPDATE content 
SET geo_point = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND geo_point IS NULL;

CREATE INDEX IF NOT EXISTS idx_content_geo_point ON content USING GIST (geo_point);
CREATE INDEX IF NOT EXISTS idx_content_category_active ON content(category, active);
CREATE INDEX IF NOT EXISTS idx_content_location_active ON content(location, active);
CREATE INDEX IF NOT EXISTS idx_content_premium ON content(is_premium) WHERE is_premium = true;
CREATE INDEX IF NOT EXISTS idx_content_verified ON content(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_content_likes ON content(likes DESC);
CREATE INDEX IF NOT EXISTS idx_content_rating ON content(rating DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_content_updated ON content(updated_at DESC);

-- Nearby content function
CREATE OR REPLACE FUNCTION get_nearby_content(
    user_lat DECIMAL, user_lng DECIMAL,
    radius_km DECIMAL DEFAULT 50, result_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID, title VARCHAR, description TEXT, image_url TEXT,
    category VARCHAR, location VARCHAR, distance_km DECIMAL,
    latitude DECIMAL, longitude DECIMAL, is_verified BOOLEAN,
    is_premium BOOLEAN, rating NUMERIC, likes INTEGER, views INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.title, c.description, c.image_url, c.category, c.location,
        ROUND((ST_Distance(c.geo_point, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography) / 1000)::DECIMAL, 2),
        c.latitude, c.longitude, c.is_verified, c.is_premium, c.rating, c.likes, c.views
    FROM content c
    WHERE c.active = true AND c.geo_point IS NOT NULL
    AND ST_DWithin(c.geo_point, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography, radius_km * 1000)
    ORDER BY 7 ASC LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

RAISE NOTICE '✅ Migration 002 complete: Geo indexes created';

-- ============ MIGRATION 003: RLS POLICIES ============

ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public content read access" ON content;
DROP POLICY IF EXISTS "content_public_read" ON content;
DROP POLICY IF EXISTS "content_service_role_all" ON content;

CREATE POLICY "content_public_read" ON content FOR SELECT USING (active = true);
CREATE POLICY "content_service_role_all" ON content FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "categories_public_read" ON categories;
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "regions_public_read" ON regions;
CREATE POLICY "regions_public_read" ON regions FOR SELECT USING (true);

DROP POLICY IF EXISTS "interactions_read_own" ON interactions;
DROP POLICY IF EXISTS "interactions_insert_all" ON interactions;
DROP POLICY IF EXISTS "interactions_delete_own" ON interactions;

CREATE POLICY "interactions_read_own" ON interactions FOR SELECT 
USING (user_id = auth.uid()::text OR user_id IS NULL OR auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "interactions_insert_all" ON interactions FOR INSERT WITH CHECK (true);
CREATE POLICY "interactions_delete_own" ON interactions FOR DELETE USING (user_id = auth.uid()::text);

-- Rate limiting
CREATE OR REPLACE FUNCTION check_interaction_rate_limit()
RETURNS TRIGGER AS $$
DECLARE recent_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO recent_count FROM interactions
    WHERE user_id = NEW.user_id AND created_at > NOW() - INTERVAL '1 minute';
    IF recent_count > 30 THEN RAISE EXCEPTION 'Rate limit exceeded'; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS rate_limit_interactions ON interactions;
CREATE TRIGGER rate_limit_interactions BEFORE INSERT ON interactions
FOR EACH ROW EXECUTE FUNCTION check_interaction_rate_limit();

RAISE NOTICE '✅ Migration 003 complete: RLS policies updated';

-- ============ MIGRATION 004: CLEANUP ============

-- Ensure categories exist
INSERT INTO categories (name, slug, description, icon) VALUES
    ('Clubes & Eventos', 'clubes-eventos', 'Clubes nocturnos y eventos', '🎉'),
    ('Bares', 'bares', 'Bares y cantinas', '🍺'),
    ('Conciertos', 'conciertos', 'Shows en vivo', '🎸'),
    ('Webcams', 'webcams', 'Shows online', '📹'),
    ('OnlyFans', 'onlyfans', 'Creadores de contenido', '⭐'),
    ('Servicios', 'servicios', 'Servicios para adultos', '💋'),
    ('Citas', 'citas', 'Apps de citas', '💕')
ON CONFLICT (slug) DO NOTHING;

-- Ensure regions exist
INSERT INTO regions (name, slug, country, state, latitude, longitude) VALUES
    ('Guadalajara', 'guadalajara', 'Mexico', 'Jalisco', 20.6597, -103.3496),
    ('Ciudad de México', 'cdmx', 'Mexico', 'CDMX', 19.4326, -99.1332),
    ('Monterrey', 'monterrey', 'Mexico', 'Nuevo León', 25.6866, -100.3161),
    ('Cancún', 'cancun', 'Mexico', 'Quintana Roo', 21.1619, -86.8515),
    ('Puerto Vallarta', 'puerto-vallarta', 'Mexico', 'Jalisco', 20.6534, -105.2253),
    ('Tijuana', 'tijuana', 'Mexico', 'Baja California', 32.5149, -117.0382),
    ('Playa del Carmen', 'playa-del-carmen', 'Mexico', 'Quintana Roo', 20.6296, -87.0739)
ON CONFLICT (slug) DO NOTHING;

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Update statistics
ANALYZE content;
ANALYZE categories;
ANALYZE regions;

RAISE NOTICE '✅ Migration 004 complete: Cleanup done';

COMMIT;

-- ============ FINAL VERIFICATION ============
SELECT 
    'content' as table_name,
    COUNT(*) as row_count,
    COUNT(latitude) as with_coords,
    COUNT(category) as with_category
FROM content;
