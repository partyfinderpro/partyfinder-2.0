-- =============================================
-- VENUZ - TODAS LAS FUNCIONES RPC NECESARIAS
-- Ejecutar en Supabase SQL Editor
-- Fecha: 6 Febrero 2026
-- =============================================

-- =============================================
-- 1. INTERACCIONES: Views, Likes, Shares
-- =============================================

-- Increment Views (usado para tracking)
CREATE OR REPLACE FUNCTION increment_views(row_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE content 
  SET views = COALESCE(views, 0) + 1,
      views_count = COALESCE(views_count, 0) + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment Likes
CREATE OR REPLACE FUNCTION increment_likes(row_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE content 
  SET likes = COALESCE(likes, 0) + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement Likes
CREATE OR REPLACE FUNCTION decrement_likes(row_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE content 
  SET likes = GREATEST(0, COALESCE(likes, 0) - 1)
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment Shares
CREATE OR REPLACE FUNCTION increment_shares(row_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE content 
  SET shares = COALESCE(shares, 0) + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 2. CATEGORÍAS: Conteo por categoría
-- =============================================

-- Get Category Counts (para sidebar con contadores)
CREATE OR REPLACE FUNCTION get_category_counts()
RETURNS TABLE (
  category VARCHAR,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.category::VARCHAR,
    COUNT(*)::BIGINT as count
  FROM content c
  WHERE c.active = true
  GROUP BY c.category
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================
-- 3. GEO: Contenido cercano (PostGIS)
-- =============================================

-- Primero habilitar PostGIS si no está habilitado
CREATE EXTENSION IF NOT EXISTS postgis;

-- Función para obtener contenido cercano
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

-- =============================================
-- 4. HIGHWAY ALGORITHM: Intent Score
-- =============================================

-- Upsert user intent (para Highway Algorithm)
CREATE OR REPLACE FUNCTION upsert_user_intent(
    p_user_id TEXT,
    p_intent_adult DECIMAL DEFAULT 0.5,
    p_intent_events DECIMAL DEFAULT 0.5,
    p_last_action TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO highway_user_intents (user_id, intent_adult, intent_events, last_action, updated_at)
    VALUES (p_user_id, p_intent_adult, p_intent_events, p_last_action, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        intent_adult = p_intent_adult,
        intent_events = p_intent_events,
        last_action = COALESCE(p_last_action, highway_user_intents.last_action),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user intent
CREATE OR REPLACE FUNCTION get_user_intent(p_user_id TEXT)
RETURNS TABLE (
    user_id TEXT,
    intent_adult DECIMAL,
    intent_events DECIMAL,
    last_action TEXT,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.user_id,
        h.intent_adult,
        h.intent_events,
        h.last_action,
        h.updated_at
    FROM highway_user_intents h
    WHERE h.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================
-- 5. VERIFICACIÓN: Probar que todo funciona
-- =============================================

-- Test increment_views
DO $$
BEGIN
    RAISE NOTICE '✅ Funciones RPC creadas exitosamente';
    RAISE NOTICE '   - increment_views(uuid)';
    RAISE NOTICE '   - increment_likes(uuid)';
    RAISE NOTICE '   - decrement_likes(uuid)';
    RAISE NOTICE '   - increment_shares(uuid)';
    RAISE NOTICE '   - get_category_counts()';
    RAISE NOTICE '   - get_nearby_content(lat, lng, radius, limit)';
    RAISE NOTICE '   - upsert_user_intent(...)';
    RAISE NOTICE '   - get_user_intent(user_id)';
END;
$$;

-- =============================================
-- CÓMO USAR:
-- 
-- En tu código TypeScript:
-- await supabase.rpc('increment_views', { row_id: contentId })
-- await supabase.rpc('get_category_counts')
-- await supabase.rpc('get_nearby_content', { 
--     user_lat: 19.4326, 
--     user_lng: -99.1332, 
--     radius_km: 25, 
--     result_limit: 20 
-- })
-- =============================================
