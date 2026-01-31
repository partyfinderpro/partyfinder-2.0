-- ============================================
-- VENUZ HIGHWAY - MIGRACIÓN FINAL DE PILARES
-- Ejecutar en Supabase SQL Editor
-- Fecha: 2026-01-30
-- ============================================
-- 
-- INSTRUCCIONES:
-- 1. Hacer backup antes de ejecutar
-- 2. Ejecutar en horario de bajo tráfico
-- 3. Revisar logs al final
-- 
-- PILARES DE VENUZ:
-- - adult: Webcams, sitios adultos, smartlinks (monetización)
-- - event: Bares, antros, fiestas, eventos (PartyFinder)
-- - job: Empleos, edecanes, modelos (Agencia)
-- ============================================

-- ============================================
-- PASO 0: AGREGAR COLUMNA SI NO EXISTE
-- ============================================

ALTER TABLE content ADD COLUMN IF NOT EXISTS pillar VARCHAR(20);
CREATE INDEX IF NOT EXISTS idx_content_pillar ON content(pillar);

-- ============================================
-- PASO 1: LOGGING INICIAL
-- ============================================

DO $$
DECLARE
    total_rows INTEGER;
    null_pillar_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_rows FROM content;
    SELECT COUNT(*) INTO null_pillar_count FROM content WHERE pillar IS NULL OR pillar = '';
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'VENUZ HIGHWAY - Migración de Pilares';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Total de registros: %', total_rows;
    RAISE NOTICE 'Registros sin pillar: %', null_pillar_count;
    RAISE NOTICE 'Iniciando migración...';
    RAISE NOTICE '============================================';
END $$;

-- Ver distribución actual
SELECT 'DISTRIBUCIÓN ANTES' AS status, pillar, COUNT(*) AS count 
FROM content 
GROUP BY pillar 
ORDER BY count DESC;

-- ============================================
-- PASO 2: ACTUALIZACIÓN DE PILARES
-- Orden: Adult primero (más específico), luego Job, finalmente Event (catch-all)
-- ============================================

-- 2A. PILAR ADULT (Monetización) - MÁS ESPECÍFICO
WITH adult_updates AS (
    UPDATE content 
    SET pillar = 'adult' 
    WHERE (pillar IS NULL OR pillar = '') AND (
        -- Por categoría directa
        lower(category) IN ('webcam', 'camsoda', 'stripchat', 'chaturbate', 'cam', 
                            'porn', 'pornsite', 'onlyfans', 'dating', 'hookup',
                            'escort', 'strip', 'stripclub', 'tabledance', 'sexshop', 'ai-porn') OR
        -- Por keywords en categoría
        lower(category) LIKE '%webcam%' OR
        lower(category) LIKE '%porn%' OR
        lower(category) LIKE '%escort%' OR
        lower(category) LIKE '%only%fans%' OR
        lower(category) LIKE '%dating%' OR
        lower(category) LIKE '%hookup%' OR
        lower(category) LIKE '%strip%' OR
        lower(category) LIKE '%cam%' OR
        -- Por source_url (sitios conocidos de adult)
        lower(source_url) LIKE '%camsoda%' OR
        lower(source_url) LIKE '%stripchat%' OR
        lower(source_url) LIKE '%chaturbate%' OR
        lower(source_url) LIKE '%xvideos%' OR
        lower(source_url) LIKE '%pornhub%' OR
        lower(source_url) LIKE '%xhamster%' OR
        lower(source_url) LIKE '%onlyfans%' OR
        lower(source_url) LIKE '%fansly%' OR
        -- CLAVE: Si tiene affiliate_url = MONETIZABLE = ADULT
        (affiliate_url IS NOT NULL AND affiliate_url != '' AND length(affiliate_url) > 10)
    )
    RETURNING id
)
SELECT 'ADULT' AS pillar, COUNT(*) AS updated FROM adult_updates;

-- 2B. PILAR JOB (Agencia/Empleos)
WITH job_updates AS (
    UPDATE content 
    SET pillar = 'job' 
    WHERE (pillar IS NULL OR pillar = '') AND (
        -- Por categoría directa
        lower(category) IN ('empleo', 'job', 'edecanes', 'modelo', 'modelos',
                            'demostradora', 'bailarina', 'casting', 'agencia', 'trabajo') OR
        -- Por keywords en categoría
        lower(category) LIKE '%empleo%' OR
        lower(category) LIKE '%edecane%' OR
        lower(category) LIKE '%modelo%' OR
        lower(category) LIKE '%agencia%' OR
        lower(category) LIKE '%trabajo%' OR
        lower(category) LIKE '%casting%' OR
        -- Por keywords en título
        lower(title) LIKE '%vacante%' OR
        lower(title) LIKE '%empleo%' OR
        lower(title) LIKE '%se solicita%' OR
        lower(title) LIKE '%buscamos%' OR
        lower(title) LIKE '%contratamos%' OR
        lower(title) LIKE '%trabajo%' OR
        lower(title) LIKE '%edecán%' OR
        lower(title) LIKE '%edecanes%' OR
        -- Por keywords en descripción
        lower(description) LIKE '%requisitos:%' OR
        lower(description) LIKE '%salario%' OR
        lower(description) LIKE '%horario de trabajo%' OR
        lower(description) LIKE '%interesadas enviar%'
    )
    RETURNING id
)
SELECT 'JOB' AS pillar, COUNT(*) AS updated FROM job_updates;

-- 2C. PILAR EVENT (PartyFinder) - CATCH-ALL
WITH event_updates AS (
    UPDATE content 
    SET pillar = 'event' 
    WHERE pillar IS NULL OR pillar = ''
    RETURNING id
)
SELECT 'EVENT' AS pillar, COUNT(*) AS updated FROM event_updates;

-- ============================================
-- PASO 3: VERIFICACIÓN Y LOGGING FINAL
-- ============================================

DO $$
DECLARE
    null_after INTEGER;
    adult_count INTEGER;
    job_count INTEGER;
    event_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_after FROM content WHERE pillar IS NULL OR pillar = '';
    SELECT COUNT(*) INTO adult_count FROM content WHERE pillar = 'adult';
    SELECT COUNT(*) INTO job_count FROM content WHERE pillar = 'job';
    SELECT COUNT(*) INTO event_count FROM content WHERE pillar = 'event';
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'MIGRACIÓN COMPLETADA';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Pilar ADULT: % registros', adult_count;
    RAISE NOTICE 'Pilar JOB: % registros', job_count;
    RAISE NOTICE 'Pilar EVENT: % registros', event_count;
    RAISE NOTICE '--------------------------------------------';
    RAISE NOTICE 'TOTAL: % registros', (adult_count + job_count + event_count);
    RAISE NOTICE 'Sin pilar (NULL): % registros', null_after;
    
    IF null_after > 0 THEN
        RAISE WARNING '⚠️ Hay % registros sin pilar asignado!', null_after;
    ELSE
        RAISE NOTICE '✅ Todos los registros tienen pilar asignado!';
    END IF;
    RAISE NOTICE '============================================';
END $$;

-- Ver distribución final
SELECT 'DISTRIBUCIÓN FINAL' AS status, pillar, COUNT(*) AS count,
       ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) AS percentage
FROM content 
GROUP BY pillar 
ORDER BY count DESC;

-- ============================================
-- PASO 4: CREAR VISTA ÚTIL PARA DEBUGGING
-- ============================================

CREATE OR REPLACE VIEW highway_pillar_stats AS
SELECT 
    pillar,
    COUNT(*) as total_items,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as items_last_week,
    ROUND(AVG(views), 0) as avg_views,
    ROUND(AVG(likes), 0) as avg_likes,
    MAX(created_at) as latest_item,
    COUNT(*) FILTER (WHERE affiliate_url IS NOT NULL) as monetizable_count
FROM content
WHERE active = true OR active IS NULL
GROUP BY pillar
ORDER BY total_items DESC;

-- Ver estadísticas
SELECT * FROM highway_pillar_stats;

-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================
