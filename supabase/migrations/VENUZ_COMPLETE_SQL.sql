-- ============================================
-- VENUZ - SQL COMPLETO PARA SUPABASE
-- Ejecutar TODO este archivo en SQL Editor
-- Fecha: 7 Febrero 2026
-- ============================================

-- ========== FUNCIONES RPC ==========

-- 1. Incrementar vistas
CREATE OR REPLACE FUNCTION increment_views(content_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE content SET views = COALESCE(views, 0) + 1 WHERE id = content_id;
END;
$$;

-- 2. Incrementar likes
CREATE OR REPLACE FUNCTION increment_likes(content_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE content SET likes = COALESCE(likes, 0) + 1 WHERE id = content_id;
END;
$$;

-- 3. Decrementar likes
CREATE OR REPLACE FUNCTION decrement_likes(content_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE content SET likes = GREATEST(COALESCE(likes, 0) - 1, 0) WHERE id = content_id;
END;
$$;

-- 4. Incrementar shares
CREATE OR REPLACE FUNCTION increment_shares(content_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE content SET shares = COALESCE(shares, 0) + 1 WHERE id = content_id;
END;
$$;

-- 5. Conteo por categoría
CREATE OR REPLACE FUNCTION get_category_counts()
RETURNS TABLE(category text, count bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT category, COUNT(*) as count
  FROM content
  WHERE active = true
  GROUP BY category
  ORDER BY count DESC;
$$;

-- 6. Geo-búsqueda con PostGIS
CREATE OR REPLACE FUNCTION get_nearby_content(
    user_lat float,
    user_lng float,
    radius_km float DEFAULT 50,
    result_limit int DEFAULT 50
)
RETURNS TABLE(
    id uuid,
    title text,
    description text,
    image_url text,
    thumbnail_url text,
    category text,
    location text,
    latitude float,
    longitude float,
    distance_km float,
    views int,
    likes int,
    is_verified boolean,
    is_premium boolean,
    affiliate_url text,
    source_url text,
    created_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        c.id,
        c.title,
        c.description,
        c.image_url,
        c.thumbnail_url,
        c.category,
        c.location,
        c.latitude::float,
        c.longitude::float,
        (6371 * acos(
            cos(radians(user_lat)) * cos(radians(c.latitude)) *
            cos(radians(c.longitude) - radians(user_lng)) +
            sin(radians(user_lat)) * sin(radians(c.latitude))
        ))::float as distance_km,
        c.views::int,
        c.likes::int,
        c.is_verified,
        c.is_premium,
        c.affiliate_url,
        c.source_url,
        c.created_at
    FROM content c
    WHERE c.active = true
      AND c.latitude IS NOT NULL
      AND c.longitude IS NOT NULL
      AND (6371 * acos(
            cos(radians(user_lat)) * cos(radians(c.latitude)) *
            cos(radians(c.longitude) - radians(user_lng)) +
            sin(radians(user_lat)) * sin(radians(c.latitude))
          )) <= radius_km
    ORDER BY distance_km ASC
    LIMIT result_limit;
$$;

-- 7. Upsert user intent (Highway Algorithm)
CREATE OR REPLACE FUNCTION upsert_user_intent(
    p_user_id text,
    p_event_score float DEFAULT 0,
    p_job_score float DEFAULT 0,
    p_adult_score float DEFAULT 0,
    p_event_likes int DEFAULT 0,
    p_job_likes int DEFAULT 0,
    p_adult_likes int DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO user_intents (
        user_id, event_score, job_score, adult_score,
        event_likes, job_likes, adult_likes, updated_at
    )
    VALUES (
        p_user_id, p_event_score, p_job_score, p_adult_score,
        p_event_likes, p_job_likes, p_adult_likes, NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        event_score = EXCLUDED.event_score,
        job_score = EXCLUDED.job_score,
        adult_score = EXCLUDED.adult_score,
        event_likes = EXCLUDED.event_likes,
        job_likes = EXCLUDED.job_likes,
        adult_likes = EXCLUDED.adult_likes,
        updated_at = NOW();
END;
$$;

-- 8. Get user intent
CREATE OR REPLACE FUNCTION get_user_intent(p_user_id text)
RETURNS TABLE(
    user_id text,
    event_score float,
    job_score float,
    adult_score float,
    event_likes int,
    job_likes int,
    adult_likes int
)
LANGUAGE sql
STABLE
AS $$
    SELECT user_id, event_score, job_score, adult_score,
           event_likes, job_likes, adult_likes
    FROM user_intents
    WHERE user_id = p_user_id;
$$;

-- ========== TABLAS ==========

-- 1. User Intents (Highway Algorithm)
CREATE TABLE IF NOT EXISTS user_intents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text UNIQUE NOT NULL,
    event_score float DEFAULT 0,
    job_score float DEFAULT 0,
    adult_score float DEFAULT 0,
    event_likes int DEFAULT 0,
    job_likes int DEFAULT 0,
    adult_likes int DEFAULT 0,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_user_intents_user_id ON user_intents(user_id);

-- 2. Push Subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text,
    endpoint text UNIQUE NOT NULL,
    subscription jsonb NOT NULL,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_endpoint ON push_subscriptions(endpoint);

-- 3. A/B Analytics
CREATE TABLE IF NOT EXISTS ab_analytics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    variant text NOT NULL,
    user_id text,
    event_type text NOT NULL,
    event_data jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ab_analytics_variant ON ab_analytics(variant);
CREATE INDEX IF NOT EXISTS idx_ab_analytics_event ON ab_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_ab_analytics_created ON ab_analytics(created_at);

-- 4. Affiliate Conversions
CREATE TABLE IF NOT EXISTS affiliate_conversions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id uuid REFERENCES content(id) ON DELETE SET NULL,
    user_id text,
    affiliate_source text,
    event_type text DEFAULT 'click', -- click, signup, purchase
    user_agent text,
    ip_hash text,
    created_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversions_source ON affiliate_conversions(affiliate_source);
CREATE INDEX IF NOT EXISTS idx_conversions_type ON affiliate_conversions(event_type);
CREATE INDEX IF NOT EXISTS idx_conversions_created ON affiliate_conversions(created_at);

-- 5. Interactions (si no existe)
CREATE TABLE IF NOT EXISTS interactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL,
    content_id uuid REFERENCES content(id) ON DELETE CASCADE,
    action text NOT NULL, -- view, like, share, click
    created_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interactions_user ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_content ON interactions(content_id);
CREATE INDEX IF NOT EXISTS idx_interactions_action ON interactions(action);

-- ========== RLS POLICIES ==========

-- Habilitar RLS
ALTER TABLE user_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para API
CREATE POLICY IF NOT EXISTS "Allow all for user_intents" ON user_intents FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for push_subscriptions" ON push_subscriptions FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for ab_analytics" ON ab_analytics FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for affiliate_conversions" ON affiliate_conversions FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for interactions" ON interactions FOR ALL USING (true);

-- ========== TRIGGER PARA UPDATED_AT ==========

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a tablas con updated_at
DROP TRIGGER IF EXISTS update_user_intents_updated_at ON user_intents;
CREATE TRIGGER update_user_intents_updated_at
    BEFORE UPDATE ON user_intents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER update_push_subscriptions_updated_at
    BEFORE UPDATE ON push_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========== VERIFICACIÓN ==========

-- Este query mostrará las tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_intents', 'push_subscriptions', 'ab_analytics', 'affiliate_conversions', 'interactions');

-- Mensaje de éxito
DO $$
BEGIN
    RAISE NOTICE '✅ VENUZ SQL ejecutado correctamente!';
    RAISE NOTICE '📊 Tablas creadas: user_intents, push_subscriptions, ab_analytics, affiliate_conversions, interactions';
    RAISE NOTICE '🔧 Funciones RPC: increment_views, increment_likes, decrement_likes, increment_shares, get_category_counts, get_nearby_content, upsert_user_intent, get_user_intent';
END $$;
