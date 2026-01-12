-- VENUZ "EL OJO DE DIOS" - Schema Update
-- 1. Enable Vector Extensions for future AI Recommendation Engine
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Expand Content Table
ALTER TABLE content 
ADD COLUMN IF NOT EXISTS min_price NUMERIC,
ADD COLUMN IF NOT EXISTS max_price NUMERIC,
ADD COLUMN IF NOT EXISTS price_level INTEGER, -- 1-4 ($ to $$$$)
ADD COLUMN IF NOT EXISTS rating NUMERIC,
ADD COLUMN IF NOT EXISTS reviews_count INTEGER,
ADD COLUMN IF NOT EXISTS external_ids JSONB DEFAULT '{}', -- {foursquare: '...', yelp: '...'}
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',     -- {target_profiles: ['mochilero'], age_range: '20-35'}
ADD COLUMN IF NOT EXISTS embedding vector(1536),           -- For semantic recommendations
ADD COLUMN IF NOT EXISTS category TEXT,                  -- Ensure category column exists
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,      -- Fix: Column was missing in PROD
ADD COLUMN IF NOT EXISTS source_site TEXT,                 -- Fix: Column was missing in PROD
ADD COLUMN IF NOT EXISTS source_url TEXT,                  -- Safeguard: Ensure core column exists
ADD COLUMN IF NOT EXISTS location_text TEXT,               -- Adding missing location column
ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Create User Profiles for Personalization
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  affinities JSONB DEFAULT '{"nightlife": 0, "food": 0, "culture": 0}',
  price_preference INTEGER DEFAULT 2, -- Average price level preference
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Critical Indexes for Scaling to 500k+ records
-- Usamos 'category' ya que es la columna de texto que está usando el frontend actualmente
CREATE INDEX IF NOT EXISTS idx_content_category_active ON content(category, active);
CREATE INDEX IF NOT EXISTS idx_content_price_level ON content(price_level) WHERE price_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_source_site ON content(source_site);

-- 5. Helper Function for Rating Calculation (Average of multiple sources)
CREATE OR REPLACE FUNCTION update_content_rating() 
RETURNS TRIGGER AS $$
BEGIN
  -- Logic to sync ratings could go here if using a separate ratings table
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
