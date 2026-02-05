-- MIGRATION: Content Archiving System
-- Priority: High (Run immediately)

-- 1. Create Archive Table (Clone structure of content)
CREATE TABLE IF NOT EXISTS content_archive (LIKE content INCLUDING ALL);

-- 2. Create Archive Function
-- Moves old, non-permanent content to archive and deletes from main table
CREATE OR REPLACE FUNCTION archive_old_content(cutoff timestamp)
RETURNS void AS $$
BEGIN
  -- Insert into archive
  INSERT INTO content_archive 
  SELECT * FROM content 
  WHERE scraped_at < cutoff 
  AND (is_permanent = false OR is_permanent IS NULL);

  -- Delete from main
  DELETE FROM content 
  WHERE scraped_at < cutoff 
  AND (is_permanent = false OR is_permanent IS NULL);
END;
$$ LANGUAGE plpgsql;

-- 3. Soft Delete Indexes
CREATE INDEX IF NOT EXISTS idx_content_scraped_at ON content(scraped_at);
