-- 001_add_quality_score.sql

-- Agregar columnas de calidad y estado
ALTER TABLE content ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 50;
ALTER TABLE content ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE content ADD COLUMN IF NOT EXISTS is_permanent BOOLEAN DEFAULT false;
ALTER TABLE content ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE content ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE content ADD COLUMN IF NOT EXISTS medium_url TEXT;
ALTER TABLE content ADD COLUMN IF NOT EXISTS large_url TEXT;

-- Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_content_active ON content(active);
CREATE INDEX IF NOT EXISTS idx_content_quality ON content(quality_score);
CREATE INDEX IF NOT EXISTS idx_content_permanent ON content(is_permanent);
CREATE INDEX IF NOT EXISTS idx_content_scraped_at ON content(scraped_at);
CREATE INDEX IF NOT EXISTS idx_content_geo ON content(latitude, longitude);

-- Comentarios explicativos
COMMENT ON COLUMN content.quality_score IS 'Score de calidad 0-100 calculado automáticamente';
COMMENT ON COLUMN content.active IS 'False si el evento ya pasó o fue borrado soft';
COMMENT ON COLUMN content.is_permanent IS 'True para venues (clubes, bares), False para eventos temporales';
