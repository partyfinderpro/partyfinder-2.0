-- ============================================
-- VENUZ MIGRATION 002: Geospatial Indexes
-- Execute in Supabase SQL Editor
-- Date: 2026-01-27
-- ============================================

-- 1. Enable PostGIS extension (required for geo queries)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Add a geography point column for efficient geo queries
ALTER TABLE content ADD COLUMN IF NOT EXISTS geo_point geography(POINT, 4326);

-- 3. Populate geo_point from lat/lng
UPDATE content 
SET geo_point = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND geo_point IS NULL;

-- 4. Create spatial index for fast proximity searches
CREATE INDEX IF NOT EXISTS idx_content_geo_point ON content USING GIST (geo_point);

-- 5. Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_content_category_active ON content(category, active);
CREATE INDEX IF NOT EXISTS idx_content_location_active ON content(location, active);
CREATE INDEX IF NOT EXISTS idx_content_premium ON content(is_premium) WHERE is_premium = true;
CREATE INDEX IF NOT EXISTS idx_content_verified ON content(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_content_likes ON content(likes DESC);
CREATE INDEX IF NOT EXISTS idx_content_rating ON content(rating DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_content_updated ON content(updated_at DESC);

-- 6. Function to calculate distance (in km) from a point
CREATE OR REPLACE FUNCTION content_distance_km(
    content_lat DECIMAL,
    content_lng DECIMAL,
    user_lat DECIMAL,
    user_lng DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    RETURN ST_Distance(
        ST_SetSRID(ST_MakePoint(content_lng, content_lat), 4326)::geography,
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) / 1000;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 7. Function to get nearby content
CREATE OR REPLACE FUNCTION get_nearby_content(
    user_lat DECIMAL,
    user_lng DECIMAL,
    radius_km DECIMAL DEFAULT 50,
    result_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    description TEXT,
    image_url TEXT,
    category VARCHAR,
    location VARCHAR,
    distance_km DECIMAL,
    latitude DECIMAL,
    longitude DECIMAL,
    is_verified BOOLEAN,
    is_premium BOOLEAN,
    rating NUMERIC,
    likes INTEGER,
    views INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.description,
        c.image_url,
        c.category,
        c.location,
        ROUND((ST_Distance(
            c.geo_point,
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
        ) / 1000)::DECIMAL, 2) as distance_km,
        c.latitude,
        c.longitude,
        c.is_verified,
        c.is_premium,
        c.rating,
        c.likes,
        c.views
    FROM content c
    WHERE c.active = true
    AND c.geo_point IS NOT NULL
    AND ST_DWithin(
        c.geo_point,
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
        radius_km * 1000  -- Convert km to meters
    )
    ORDER BY distance_km ASC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- USAGE EXAMPLE:
-- SELECT * FROM get_nearby_content(20.6597, -103.3496, 25, 20);
-- This gets 20 items within 25km of Guadalajara
-- ============================================
