-- =============================================
-- INTERACTION RPCS - FIXING STATS COUNTERS
-- =============================================

-- Increment Views
CREATE OR REPLACE FUNCTION increment_views(row_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE content 
  SET views = COALESCE(views, 0) + 1,
      views_count = COALESCE(views_count, 0) + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;

-- Increment Likes
CREATE OR REPLACE FUNCTION increment_likes(row_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE content 
  SET likes = COALESCE(likes, 0) + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement Likes
CREATE OR REPLACE FUNCTION decrement_likes(row_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE content 
  SET likes = GREATEST(0, COALESCE(likes, 0) - 1)
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;

-- Increment Shares
CREATE OR REPLACE FUNCTION increment_shares(row_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE content 
  SET shares = COALESCE(shares, 0) + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;
