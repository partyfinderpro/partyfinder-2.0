-- Ejecutar en Supabase SQL Editor
ALTER TABLE content ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE content ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE content ADD COLUMN IF NOT EXISTS og_title TEXT;
ALTER TABLE content ADD COLUMN IF NOT EXISTS og_description TEXT;
