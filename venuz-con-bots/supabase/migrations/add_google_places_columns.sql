-- Add Google Places columns to content table (Corrected)
ALTER TABLE content 
ADD COLUMN IF NOT EXISTS google_place_id TEXT UNIQUE, -- Singular matching Google "Place ID"
ADD COLUMN IF NOT EXISTS rating NUMERIC,
ADD COLUMN IF NOT EXISTS user_ratings_total INTEGER,
ADD COLUMN IF NOT EXISTS opening_hours JSONB,
ADD COLUMN IF NOT EXISTS price_level INTEGER,
ADD COLUMN IF NOT EXISTS formatted_address TEXT,
ADD COLUMN IF NOT EXISTS formatted_phone_number TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
ADD COLUMN IF NOT EXISTS photos JSONB;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_content_google_place_id ON content(google_place_id);

COMMENT ON COLUMN content.google_place_id IS 'Unique Place ID from Google Places API';
COMMENT ON COLUMN content.rating IS 'Rating from 1.0 to 5.0';
COMMENT ON COLUMN content.user_ratings_total IS 'Total number of ratings';
