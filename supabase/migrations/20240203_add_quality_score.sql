-- MIGRATION: Add Quality Score and Permanent Venue Tracking
-- Priority: High (Run immediately)

-- 1. Add Quality & Status Columns
ALTER TABLE content 
ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS is_permanent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'es';

-- 2. Index for Quality Filtering
CREATE INDEX IF NOT EXISTS idx_content_quality ON content(quality_score);
CREATE INDEX IF NOT EXISTS idx_content_permanent ON content(is_permanent);

-- 3. Comments for Documentation
COMMENT ON COLUMN content.quality_score IS 'Score 0-100 based on completeness, spelling, and source reliability';
COMMENT ON COLUMN content.is_permanent IS 'True for venues (clubs, bars), False for one-time events';
