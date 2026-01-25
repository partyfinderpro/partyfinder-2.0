-- VENUZ: Crear indice unico en source_url para evitar duplicados

-- 1. Limpiar duplicados manteniendo el mas reciente (por ID)
-- Esto es necesario porque si hay duplicados, la creacion del indice unico fallara.
DELETE FROM content a USING content b 
WHERE a.id < b.id AND a.source_url = b.source_url;

-- 2. Crear el indice unico (Unique Index)
-- Esto asegura que futuros inserts con el mismo source_url fallaran o se manejaran como upserts
CREATE UNIQUE INDEX IF NOT EXISTS content_source_url_unique ON content (source_url);

-- 3. (Opcional) Verificar
-- SELECT indexname FROM pg_indexes WHERE tablename = 'content';
