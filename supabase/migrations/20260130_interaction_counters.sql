
-- SQL to add increment/decrement functions for interactions
-- Run this in Supabase SQL Editor

-- 1. Add 'shares' column if missing
ALTER TABLE content ADD COLUMN IF NOT EXISTS shares INTEGER DEFAULT 0;
ALTER TABLE content ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE content ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;

-- 2. Increment Views
CREATE OR REPLACE FUNCTION increment_views(row_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE content
  SET views = COALESCE(views, 0) + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Increment Likes
CREATE OR REPLACE FUNCTION increment_likes(row_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE content
  SET likes = COALESCE(likes, 0) + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Decrement Likes
CREATE OR REPLACE FUNCTION decrement_likes(row_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE content
  SET likes = GREATEST(0, COALESCE(likes, 0) - 1)
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Increment Shares
CREATE OR REPLACE FUNCTION increment_shares(row_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE content
  SET shares = COALESCE(shares, 0) + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;
