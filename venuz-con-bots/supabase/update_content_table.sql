-- SQL Update for VENUZ Content Table
-- Run this in your Supabase SQL Editor

ALTER TABLE content 
ADD COLUMN IF NOT EXISTS rating NUMERIC,
ADD COLUMN IF NOT EXISTS total_ratings INTEGER,
ADD COLUMN IF NOT EXISTS is_open_now BOOLEAN,
ADD COLUMN IF NOT EXISTS opening_hours TEXT[],
ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
ADD COLUMN IF NOT EXISTS google_place_id TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS price_level INTEGER;

-- Index for searching by google_place_id
CREATE INDEX IF NOT EXISTS idx_content_google_place_id ON content(google_place_id);
