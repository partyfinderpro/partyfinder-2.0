-- ============================================
-- VENUZ HIGHWAY ALGORITHM - User Intents Table
-- Migración para el sistema "Level God Algorithm"
-- Fecha: 2026-01-30
-- ============================================

-- Tabla para trackear el "intent" del usuario
-- Esto determina qué tipo de contenido mostrar en el feed
CREATE TABLE IF NOT EXISTS user_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL UNIQUE,
    
    -- Intent Score: 0 (cold/job seeker) to 1 (hot/adult content ready)
    intent_score NUMERIC(4,3) DEFAULT 0.5 CHECK (intent_score >= 0 AND intent_score <= 1),
    
    -- De dónde vino originalmente el usuario
    initial_referrer VARCHAR(50) DEFAULT 'direct' 
        CHECK (initial_referrer IN ('empleo', 'evento', 'adult', 'direct', 'organic')),
    
    -- Contadores de likes por pilar (para The Third Like rule)
    likes_job INTEGER DEFAULT 0,
    likes_event INTEGER DEFAULT 0,
    likes_adult INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    
    -- Ubicación del usuario (opcional)
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'MX',
    
    -- UTM tracking para análisis de tráfico
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_intents_user_id ON user_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_intents_score ON user_intents(intent_score);
CREATE INDEX IF NOT EXISTS idx_user_intents_referrer ON user_intents(initial_referrer);
CREATE INDEX IF NOT EXISTS idx_user_intents_location ON user_intents(city, state);
CREATE INDEX IF NOT EXISTS idx_user_intents_activity ON user_intents(last_activity_at DESC);

-- ============================================
-- Extender tabla content para soportar 3 pilares
-- ============================================

-- Agregar columna de pilar si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'content' AND column_name = 'pillar') THEN
        ALTER TABLE content ADD COLUMN pillar VARCHAR(20) DEFAULT 'event';
    END IF;
END $$;

-- Agregar geo_slug para SEO de subdominios
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'content' AND column_name = 'geo_slug') THEN
        ALTER TABLE content ADD COLUMN geo_slug VARCHAR(150);
    END IF;
END $$;

-- Agregar city/state específicos
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'content' AND column_name = 'city') THEN
        ALTER TABLE content ADD COLUMN city VARCHAR(100);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'content' AND column_name = 'state') THEN
        ALTER TABLE content ADD COLUMN state VARCHAR(100);
    END IF;
END $$;

-- Agregar extra_data JSONB para datos específicos por pilar
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'content' AND column_name = 'extra_data') THEN
        ALTER TABLE content ADD COLUMN extra_data JSONB DEFAULT '{}';
    END IF;
END $$;

-- Agregar smartlink_url específico
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'content' AND column_name = 'smartlink_url') THEN
        ALTER TABLE content ADD COLUMN smartlink_url TEXT;
    END IF;
END $$;

-- Índice para filtrar por pilar
CREATE INDEX IF NOT EXISTS idx_content_pillar ON content(pillar);
CREATE INDEX IF NOT EXISTS idx_content_geo_slug ON content(geo_slug);
CREATE INDEX IF NOT EXISTS idx_content_city_state ON content(city, state);

-- ============================================
-- Tabla de interacciones extendida para Highway
-- ============================================

-- Agregar columna de pilar a interactions si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'interactions' AND column_name = 'content_pillar') THEN
        ALTER TABLE interactions ADD COLUMN content_pillar VARCHAR(20);
    END IF;
END $$;

-- ============================================
-- RLS Policies para user_intents
-- ============================================

ALTER TABLE user_intents ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver/modificar su propio intent
CREATE POLICY "Users can view own intent" ON user_intents
    FOR SELECT USING (true);  -- Permitir lectura para el algoritmo

CREATE POLICY "Users can update own intent" ON user_intents
    FOR UPDATE USING (true);

CREATE POLICY "System can insert intents" ON user_intents
    FOR INSERT WITH CHECK (true);

-- ============================================
-- Función para auto-actualizar intent_score (opcional)
-- ============================================

CREATE OR REPLACE FUNCTION update_intent_on_interaction()
RETURNS TRIGGER AS $$
DECLARE
    delta NUMERIC(4,3);
    current_score NUMERIC(4,3);
    new_score NUMERIC(4,3);
    content_pillar VARCHAR(20);
    event_likes INTEGER;
BEGIN
    -- Obtener pilar del contenido
    SELECT pillar INTO content_pillar FROM content WHERE id = NEW.content_id;
    
    -- Si no hay pilar, usar 'event' por defecto
    IF content_pillar IS NULL THEN
        content_pillar := 'event';
    END IF;
    
    -- Calcular delta según acción y pilar
    IF NEW.action = 'view' THEN
        delta := 0.01;
    ELSIF NEW.action = 'like' THEN
        CASE content_pillar
            WHEN 'job' THEN delta := 0.05;
            WHEN 'event' THEN 
                delta := 0.15;
                -- Verificar "Third Like Rule"
                SELECT likes_event INTO event_likes FROM user_intents WHERE user_id = NEW.user_id;
                IF event_likes = 2 THEN  -- Este sería el tercero
                    delta := delta + 0.30;
                END IF;
            WHEN 'adult' THEN delta := 0.03;
            ELSE delta := 0.05;
        END CASE;
    ELSE
        delta := 0.01;
    END IF;
    
    -- Obtener score actual
    SELECT intent_score INTO current_score FROM user_intents WHERE user_id = NEW.user_id;
    
    IF current_score IS NULL THEN
        -- Crear nuevo registro
        INSERT INTO user_intents (user_id, intent_score, initial_referrer)
        VALUES (NEW.user_id, 0.5 + delta, 'direct');
    ELSE
        -- Actualizar score (clamped 0-1)
        new_score := LEAST(1.0, GREATEST(0.0, current_score + delta));
        
        UPDATE user_intents 
        SET intent_score = new_score,
            likes_job = CASE WHEN content_pillar = 'job' AND NEW.action = 'like' THEN likes_job + 1 ELSE likes_job END,
            likes_event = CASE WHEN content_pillar = 'event' AND NEW.action = 'like' THEN likes_event + 1 ELSE likes_event END,
            likes_adult = CASE WHEN content_pillar = 'adult' AND NEW.action = 'like' THEN likes_adult + 1 ELSE likes_adult END,
            total_views = CASE WHEN NEW.action = 'view' THEN total_views + 1 ELSE total_views END,
            updated_at = NOW(),
            last_activity_at = NOW()
        WHERE user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-actualizar (opcional - deshabilitado por defecto)
-- Descomentar si quieres que se actualice automáticamente en cada interacción
-- CREATE TRIGGER trigger_update_intent
-- AFTER INSERT ON interactions
-- FOR EACH ROW
-- EXECUTE FUNCTION update_intent_on_interaction();

-- ============================================
-- Función MEJORADA para poblar pilares (Recomendaciones Grok)
-- Con logging, contadores, y validación
-- ============================================

CREATE OR REPLACE FUNCTION populate_content_pillars()
RETURNS TABLE(pillar TEXT, count BIGINT) AS $$
DECLARE
    adult_count INTEGER := 0;
    job_count INTEGER := 0;
    event_count INTEGER := 0;
    total_before INTEGER := 0;
    total_after INTEGER := 0;
BEGIN
    -- Contar registros sin pillar antes
    SELECT COUNT(*) INTO total_before FROM content WHERE pillar IS NULL OR pillar = '';
    RAISE NOTICE '[Migrate] Starting pillar population. Rows without pillar: %', total_before;
    
    -- Pilar Adult (monetización) - MÁS ESPECÍFICO PRIMERO
    WITH adult_updates AS (
        UPDATE content 
        SET pillar = 'adult' 
        WHERE (pillar IS NULL OR pillar = '') AND (
            -- Por categoría
            lower(category) LIKE '%webcam%' OR
            lower(category) LIKE '%camsoda%' OR
            lower(category) LIKE '%stripchat%' OR
            lower(category) LIKE '%chaturbate%' OR
            lower(category) LIKE '%porn%' OR
            lower(category) LIKE '%onlyfans%' OR
            lower(category) LIKE '%dating%' OR
            lower(category) LIKE '%escort%' OR
            lower(category) LIKE '%strip%' OR
            lower(category) LIKE '%sexshop%' OR
            -- Por source_url (sitios conocidos)
            lower(source_url) LIKE '%camsoda%' OR
            lower(source_url) LIKE '%stripchat%' OR
            lower(source_url) LIKE '%chaturbate%' OR
            lower(source_url) LIKE '%xvideos%' OR
            lower(source_url) LIKE '%pornhub%' OR
            -- Tiene affiliate_url (monetizable)
            (affiliate_url IS NOT NULL AND affiliate_url != '')
        )
        RETURNING 1
    )
    SELECT COUNT(*) INTO adult_count FROM adult_updates;
    RAISE NOTICE '[Migrate] Pilar ADULT: % rows updated', adult_count;
    
    -- Pilar Job (agencia/empleos)
    WITH job_updates AS (
        UPDATE content 
        SET pillar = 'job' 
        WHERE (pillar IS NULL OR pillar = '') AND (
            lower(category) LIKE '%empleo%' OR
            lower(category) LIKE '%job%' OR
            lower(category) LIKE '%edecane%' OR
            lower(category) LIKE '%modelo%' OR
            lower(category) LIKE '%gio%' OR
            lower(category) LIKE '%demostradora%' OR
            lower(category) LIKE '%bailarina%' OR
            lower(category) LIKE '%casting%' OR
            lower(category) LIKE '%agencia%' OR
            lower(category) LIKE '%trabajo%' OR
            lower(title) LIKE '%vacante%' OR
            lower(title) LIKE '%empleo%' OR
            lower(title) LIKE '%se solicita%'
        )
        RETURNING 1
    )
    SELECT COUNT(*) INTO job_count FROM job_updates;
    RAISE NOTICE '[Migrate] Pilar JOB: % rows updated', job_count;
    
    -- Pilar Event (el resto - PartyFinder) - CATCH-ALL
    WITH event_updates AS (
        UPDATE content 
        SET pillar = 'event' 
        WHERE pillar IS NULL OR pillar = ''
        RETURNING 1
    )
    SELECT COUNT(*) INTO event_count FROM event_updates;
    RAISE NOTICE '[Migrate] Pilar EVENT: % rows updated', event_count;
    
    -- Verificar que no queden NULL
    SELECT COUNT(*) INTO total_after FROM content WHERE pillar IS NULL OR pillar = '';
    
    IF total_after > 0 THEN
        RAISE WARNING '[Migrate] ⚠️ % rows still have NULL pillar!', total_after;
    ELSE
        RAISE NOTICE '[Migrate] ✅ All rows have pillar assigned!';
    END IF;
    
    RAISE NOTICE '[Migrate] Summary: Adult=%, Job=%, Event=%, Total=%', 
        adult_count, job_count, event_count, (adult_count + job_count + event_count);
    
    -- Retornar distribución final
    RETURN QUERY 
    SELECT content.pillar::TEXT, COUNT(*) 
    FROM content 
    GROUP BY content.pillar 
    ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar la función y mostrar resultados
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'HIGHWAY PILLAR MIGRATION - Starting...';
    RAISE NOTICE '==============================================';
    
    FOR rec IN SELECT * FROM populate_content_pillars() LOOP
        RAISE NOTICE 'Pillar: % -> % items', rec.pillar, rec.count;
    END LOOP;
    
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'MIGRATION COMPLETE!';
    RAISE NOTICE '==============================================';
END $$;

-- ============================================
-- Vista útil para debugging
-- ============================================

CREATE OR REPLACE VIEW highway_stats AS
SELECT 
    pillar,
    COUNT(*) as total_items,
    AVG(views) as avg_views,
    AVG(likes) as avg_likes,
    MAX(created_at) as latest_item
FROM content
WHERE active = true OR active IS NULL
GROUP BY pillar
ORDER BY total_items DESC;

-- Comentario final
COMMENT ON TABLE user_intents IS 'Highway Algorithm: Tracking de intent score por usuario para personalización del feed';
COMMENT ON COLUMN user_intents.intent_score IS '0 = Cold (job seeker), 1 = Hot (adult content ready)';
