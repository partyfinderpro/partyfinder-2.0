-- ============================================
-- VENUZ ALL-IN-ONE MIGRATION SCRIPT (V3 - FINAL)
-- Copy and paste this into Supabase SQL Editor
-- Date: 2026-01-27
-- ============================================

BEGIN;

-- ============ PRE-CHECK: Create/Update base tables ============

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE,
    description TEXT,
    icon VARCHAR(10),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Regions table - add missing columns if table exists
CREATE TABLE IF NOT EXISTS regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns to regions
ALTER TABLE regions ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE regions ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE regions ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE regions ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Interactions table
CREATE TABLE IF NOT EXISTS interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    content_id UUID,
    action VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============ CONTENT TABLE: Add missing columns ============
ALTER TABLE content ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE content ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
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

-- ============ TRIGGER: Auto-update updated_at ============
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_content_updated_at ON content;
CREATE TRIGGER update_content_updated_at
    BEFORE UPDATE ON content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============ POPULATE DATA FROM FKs (safe) ============
DO $$
BEGIN
    UPDATE content c SET category = cat.name
    FROM categories cat
    WHERE c.category_id::text = cat.id::text AND c.category IS NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    UPDATE content c SET location = r.name
    FROM regions r
    WHERE c.region_id::text = r.id::text AND c.location IS NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    UPDATE content c SET latitude = r.latitude, longitude = r.longitude
    FROM regions r
    WHERE c.region_id::text = r.id::text AND c.latitude IS NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_content_active ON content(active);
CREATE INDEX IF NOT EXISTS idx_content_category_active ON content(category, active);
CREATE INDEX IF NOT EXISTS idx_content_location_active ON content(location, active);
CREATE INDEX IF NOT EXISTS idx_content_premium ON content(is_premium) WHERE is_premium = true;
CREATE INDEX IF NOT EXISTS idx_content_verified ON content(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_content_likes ON content(likes DESC);
CREATE INDEX IF NOT EXISTS idx_content_rating ON content(rating DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_content_updated ON content(updated_at DESC);

-- ============ RLS POLICIES ============
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

-- ============ RATE LIMITING ============
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

-- ============ SEED DATA: Categories ============
INSERT INTO categories (name, slug, description, icon) VALUES
    ('Clubes & Eventos', 'clubes-eventos', 'Clubes nocturnos y eventos', '🎉'),
    ('Bares', 'bares', 'Bares y cantinas', '🍺'),
    ('Conciertos', 'conciertos', 'Shows en vivo', '🎸'),
    ('Webcams', 'webcams', 'Shows online', '📹'),
    ('OnlyFans', 'onlyfans', 'Creadores de contenido', '⭐'),
    ('Servicios', 'servicios', 'Servicios para adultos', '💋'),
    ('Citas', 'citas', 'Apps de citas', '💕')
ON CONFLICT (slug) DO NOTHING;

-- ============ SEED DATA: Regions ============
INSERT INTO regions (name, slug, country, state, latitude, longitude) VALUES
    ('Guadalajara', 'guadalajara', 'Mexico', 'Jalisco', 20.6597, -103.3496),
    ('Ciudad de México', 'cdmx', 'Mexico', 'CDMX', 19.4326, -99.1332),
    ('Monterrey', 'monterrey', 'Mexico', 'Nuevo León', 25.6866, -100.3161),
    ('Cancún', 'cancun', 'Mexico', 'Quintana Roo', 21.1619, -86.8515),
    ('Puerto Vallarta', 'puerto-vallarta', 'Mexico', 'Jalisco', 20.6534, -105.2253),
    ('Tijuana', 'tijuana', 'Mexico', 'Baja California', 32.5149, -117.0382),
    ('Playa del Carmen', 'playa-del-carmen', 'Mexico', 'Quintana Roo', 20.6296, -87.0739)
ON CONFLICT (slug) DO NOTHING;

-- ============ FAVORITES TABLE ============
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    content_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favorites_user_read" ON favorites;
DROP POLICY IF EXISTS "favorites_user_write" ON favorites;
CREATE POLICY "favorites_user_read" ON favorites FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "favorites_user_write" ON favorites FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============ ANALYZE ============
ANALYZE content;
ANALYZE categories;
ANALYZE regions;

COMMIT;

-- ============ VERIFICATION ============
SELECT 
    'content' as table_name,
    COUNT(*) as row_count,
    COUNT(latitude) as with_coords,
    COUNT(category) as with_category,
    COUNT(CASE WHEN active = true THEN 1 END) as active_count
FROM content;
