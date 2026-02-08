-- ============================================
-- VENUZ - DYNAMIC CONTENT & HIGHWAY ALGORITHM UPDATE
-- Fecha: 8 Febrero 2026
-- ============================================

-- 1. Agregando columnas para Contenido Dinámico (si no existen)
DO $$
BEGIN
    -- Media Previews
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'preview_video_url') THEN
        ALTER TABLE content ADD COLUMN preview_video_url text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'preview_type') THEN
        ALTER TABLE content ADD COLUMN preview_type text; -- video, gif, iframe, image, embed
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'iframe_preview_url') THEN
        ALTER TABLE content ADD COLUMN iframe_preview_url text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'embed_code') THEN
        ALTER TABLE content ADD COLUMN embed_code text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'gallery_urls') THEN
        ALTER TABLE content ADD COLUMN gallery_urls text[];
    END IF;

    -- Business & Affiliates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'official_website') THEN
        ALTER TABLE content ADD COLUMN official_website text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'has_affiliate') THEN
        ALTER TABLE content ADD COLUMN has_affiliate boolean DEFAULT false;
    END IF;
    
    -- Quality & Ranking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'content_tier') THEN
        ALTER TABLE content ADD COLUMN content_tier text DEFAULT 'scraped'; -- premium, verified, scraped
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'quality_score') THEN
        ALTER TABLE content ADD COLUMN quality_score float DEFAULT 50;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'is_featured') THEN
        ALTER TABLE content ADD COLUMN is_featured boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'priority_boost') THEN
        ALTER TABLE content ADD COLUMN priority_boost float DEFAULT 0;
    END IF;

    -- Analytics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'preview_views') THEN
        ALTER TABLE content ADD COLUMN preview_views int DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'preview_last_fetched') THEN
        ALTER TABLE content ADD COLUMN preview_last_fetched timestamptz;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'preview_etag') THEN
        ALTER TABLE content ADD COLUMN preview_etag text;
    END IF;
END $$;

-- 2. Performance Indices
CREATE INDEX IF NOT EXISTS idx_content_tier ON content(content_tier);
CREATE INDEX IF NOT EXISTS idx_content_quality ON content(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_content_affiliate ON content(has_affiliate);
CREATE INDEX IF NOT EXISTS idx_content_featured ON content(is_featured);
CREATE INDEX IF NOT EXISTS idx_content_preview_type ON content(preview_type);

-- 3. RPC: Increment Preview Views
CREATE OR REPLACE FUNCTION increment_preview_views(content_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE content SET preview_views = COALESCE(preview_views, 0) + 1 WHERE id = content_id;
END;
$$;

-- 4. Highway Algorithm Tables (Faltantes)

-- Configuración Dinámica (Ratios base, modificadores por hora/día)
CREATE TABLE IF NOT EXISTS algorithm_config (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    config_key text UNIQUE NOT NULL,
    config_value jsonb,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
);

-- Ciudades y sus overrides
CREATE TABLE IF NOT EXISTS cities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    slug text UNIQUE NOT NULL,
    name text NOT NULL,
    country text NOT NULL,
    ratio_overrides jsonb,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT NOW()
);

-- User Engagement (Tracking granular para el algoritmo)
CREATE TABLE IF NOT EXISTS user_engagement (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text,
    device_id text, -- Fingerprint para usuarios no logueados
    category_slug text,
    time_spent float DEFAULT 0,
    clicked boolean DEFAULT false,
    content_id uuid REFERENCES content(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_engagement_device ON user_engagement(device_id);
CREATE INDEX IF NOT EXISTS idx_user_engagement_created ON user_engagement(created_at);

-- Feed Cache (Para evitar queries pesados repetitivos)
CREATE TABLE IF NOT EXISTS feed_cache (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    cache_key text UNIQUE NOT NULL,
    city_slug text,
    category_slug text,
    items jsonb, -- Array of items pre-computed
    item_count int,
    hits int DEFAULT 0,
    expires_at timestamptz,
    created_at timestamptz DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feed_cache_key ON feed_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_feed_cache_expires ON feed_cache(expires_at);

-- 5. RPC: Increment Cache Hit
CREATE OR REPLACE FUNCTION increment_cache_hit(key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE feed_cache SET hits = COALESCE(hits, 0) + 1 WHERE cache_key = key;
END;
$$;

-- 6. RLS Policies
ALTER TABLE algorithm_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read algorithm_config" ON algorithm_config FOR SELECT USING (true);
CREATE POLICY "Public read cities" ON cities FOR SELECT USING (true);
CREATE POLICY "Public insert user_engagement" ON user_engagement FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read feed_cache" ON feed_cache FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON feed_cache FOR ALL USING (true); -- Para upsert desde server/worker
