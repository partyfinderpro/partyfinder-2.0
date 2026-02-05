-- 002_add_content_archive.sql

-- Crear tabla de archivo clonando estructura
CREATE TABLE IF NOT EXISTS content_archive (LIKE content INCLUDING ALL);

-- Índice para búsquedas históricas
CREATE INDEX IF NOT EXISTS idx_archive_scraped_at ON content_archive(scraped_at);

-- Función para archivar contenido viejo
CREATE OR REPLACE FUNCTION archive_old_content(cutoff timestamp)
RETURNS void AS $$
BEGIN
  -- Mover a archivo (ignorando si ya existe)
  INSERT INTO content_archive 
  SELECT * FROM content 
  WHERE scraped_at < cutoff 
  AND is_permanent = false
  ON CONFLICT DO NOTHING;
  
  -- Borrar de tabla principal
  DELETE FROM content 
  WHERE scraped_at < cutoff 
  AND is_permanent = false;
END;
$$ LANGUAGE plpgsql;
