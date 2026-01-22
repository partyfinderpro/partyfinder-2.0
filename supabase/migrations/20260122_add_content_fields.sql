-- Migration script to add new fields for VENUZ V2 functionality
-- Execute this in Supabase SQL Editor

-- 1. Add new columns to 'content' table
ALTER TABLE content
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS affiliate_url TEXT,
ADD COLUMN IF NOT EXISTS affiliate_source TEXT, -- 'camsoda', 'stripchat', 'other'
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS open_until TEXT;

-- 2. Add indexes for new query patterns
CREATE INDEX IF NOT EXISTS idx_content_is_premium ON content(is_premium);
CREATE INDEX IF NOT EXISTS idx_content_affiliate_source ON content(affiliate_source);

-- 3. Update RLS policies (optional, usually readable by everyone)
-- Ensure 'content' is readable by anonymous
-- (Assuming policies already exist, no action needed unless strictly restrictive)

-- 4. Verification
-- SELECT * FROM content LIMIT 1;
