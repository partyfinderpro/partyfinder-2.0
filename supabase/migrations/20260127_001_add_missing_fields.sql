-- ============================================
-- VENUZ MIGRATION 001: Add Missing Fields to Content
-- Execute in Supabase SQL Editor
-- Date: 2026-01-27
-- ============================================

-- 1. Add geolocation fields (for distance calculations)
ALTER TABLE content ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE content ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- 2. Add location as cached string (for display without joins)
ALTER TABLE content ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- 3. Add verification and premium flags
ALTER TABLE content ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE content ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- 4. Add business hours fields
ALTER TABLE content ADD COLUMN IF NOT EXISTS is_open_now BOOLEAN DEFAULT NULL;
ALTER TABLE content ADD COLUMN IF NOT EXISTS open_until VARCHAR(50);

-- 5. Add engagement counters (cached for performance)
ALTER TABLE content ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;

-- 6. Add contact/address info
ALTER TABLE content ADD COLUMN IF NOT EXISTS address VARCHAR(500);
ALTER TABLE content ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- 7. Add rating field
ALTER TABLE content ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT NULL;

-- 8. Add updated_at timestamp for auditing
ALTER TABLE content ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 9. Add category as string (for backwards compatibility with frontend)
-- The frontend uses 'category' as string, not 'category_id' as FK
ALTER TABLE content ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- 10. Add distance_km (will be calculated client-side, but useful for sorting)
ALTER TABLE content ADD COLUMN IF NOT EXISTS distance_km DECIMAL(6,2);

-- 11. Add subcategory for more granular filtering
ALTER TABLE content ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100);

-- 12. Update trigger for updated_at
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

-- 13. Populate 'category' string from 'category_id' FK (if categories table has data)
UPDATE content c
SET category = cat.name
FROM categories cat
WHERE c.category_id = cat.id
AND c.category IS NULL;

-- 14. Populate 'location' string from 'region_id' FK (if regions table has data)
UPDATE content c
SET location = r.name
FROM regions r
WHERE c.region_id = r.id
AND c.location IS NULL;

-- 15. Copy latitude/longitude from regions if content doesn't have it
UPDATE content c
SET 
    latitude = r.latitude,
    longitude = r.longitude
FROM regions r
WHERE c.region_id = r.id
AND c.latitude IS NULL;

-- ============================================
-- VERIFICATION QUERY (Run after migration)
-- ============================================
-- SELECT 
--     id, title, category, location, latitude, longitude, 
--     is_verified, is_premium, likes, rating, updated_at
-- FROM content 
-- LIMIT 5;
