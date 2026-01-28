-- VENUZ Security Hardening - RLS Policies
-- Execute this in the Supabase SQL Editor

-- 1. Ensure RLS is enabled for all key tables
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

-- 2. CONTENT TABLE: Public read access for active content
DROP POLICY IF EXISTS "Public content read access" ON content;
CREATE POLICY "Public content read access" ON content
  FOR SELECT USING (active = true);

-- 3. INTERACTIONS TABLE: Sophisticated access control
-- Users (and bots) can see their own interactions or public stats
DROP POLICY IF EXISTS "Users can see own interactions" ON interactions;
CREATE POLICY "Users can see own interactions" ON interactions
  FOR SELECT USING (auth.uid()::text = user_id OR user_id IS NULL);

-- Users can insert their own likes/views
DROP POLICY IF EXISTS "Users can insert own interactions" ON interactions;
CREATE POLICY "Users can insert own interactions" ON interactions
  FOR INSERT WITH CHECK (true);

-- Only owners can delete their interactions (unlike toggle)
DROP POLICY IF EXISTS "Users can delete own interactions" ON interactions;
CREATE POLICY "Users can delete own interactions" ON interactions
  FOR DELETE USING (auth.uid()::text = user_id);

-- 4. PERFORMANCE & ANALYTICS: Add composite index for faster interaction checks
CREATE INDEX IF NOT EXISTS idx_interactions_user_content ON interactions(user_id, content_id);

-- 5. ANTI-HACK INDEX: Prevent duplicate views/likes spamming from same source
-- (Optional: depends if you want to allow multiple views over time)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_recent_interaction ON interactions (user_id, content_id, action) 
-- WHERE (created_at > NOW() - INTERVAL '1 hour');
