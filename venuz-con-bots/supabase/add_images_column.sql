-- Add images array column to content table for carousel support
ALTER TABLE content ADD COLUMN IF NOT EXISTS images TEXT[];

-- Add location column if missing (some scrapers use 'location' instead of 'location_text')
ALTER TABLE content ADD COLUMN IF NOT EXISTS location TEXT;

-- Update existing records if needed (set images to array containing image_url)
UPDATE content SET images = ARRAY[image_url] WHERE image_url IS NOT NULL AND images IS NULL;
