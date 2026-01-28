-- ============================================
-- VENUZ MIGRATION 003: RLS Policies Update
-- Execute in Supabase SQL Editor
-- Date: 2026-01-27
-- ============================================

-- ========== CONTENT TABLE ==========

-- Ensure RLS is enabled
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Public content read access" ON content;
DROP POLICY IF EXISTS "Service role full access" ON content;
DROP POLICY IF EXISTS "Authenticated users can insert" ON content;

-- 1. Public read access (anonymous users can view active content)
CREATE POLICY "content_public_read" ON content
    FOR SELECT
    USING (active = true);

-- 2. Service role has full access (for API/scrapers)
CREATE POLICY "content_service_role_all" ON content
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- 3. Authenticated users can insert (for user-generated content)
CREATE POLICY "content_auth_insert" ON content
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- ========== CATEGORIES TABLE ==========

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public categories read access" ON categories;

CREATE POLICY "categories_public_read" ON categories
    FOR SELECT
    USING (true);

CREATE POLICY "categories_service_role_all" ON categories
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ========== REGIONS TABLE ==========

ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public regions read access" ON regions;

CREATE POLICY "regions_public_read" ON regions
    FOR SELECT
    USING (true);

CREATE POLICY "regions_service_role_all" ON regions
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ========== INTERACTIONS TABLE ==========

ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see own interactions" ON interactions;
DROP POLICY IF EXISTS "Users can insert own interactions" ON interactions;
DROP POLICY IF EXISTS "Users can delete own interactions" ON interactions;

-- Users can view their own interactions or aggregate stats
CREATE POLICY "interactions_read_own" ON interactions
    FOR SELECT
    USING (
        user_id = auth.uid()::text 
        OR user_id IS NULL 
        OR auth.jwt() ->> 'role' = 'service_role'
    );

-- Anyone can insert interactions (anonymous tracking with user_id)
CREATE POLICY "interactions_insert_all" ON interactions
    FOR INSERT
    WITH CHECK (true);

-- Users can delete their own interactions (unlike)
CREATE POLICY "interactions_delete_own" ON interactions
    FOR DELETE
    USING (user_id = auth.uid()::text);

-- ========== PROFILES TABLE (if exists) ==========

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        -- Users can view their own profile
        EXECUTE 'DROP POLICY IF EXISTS "profiles_read_own" ON profiles';
        EXECUTE 'CREATE POLICY "profiles_read_own" ON profiles FOR SELECT USING (auth.uid() = id)';
        
        -- Users can update their own profile
        EXECUTE 'DROP POLICY IF EXISTS "profiles_update_own" ON profiles';
        EXECUTE 'CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id)';
    END IF;
END $$;

-- ========== ANTI-SPAM TRIGGER ==========

-- Prevent rapid-fire interactions (rate limiting)
CREATE OR REPLACE FUNCTION check_interaction_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
    recent_count INTEGER;
BEGIN
    -- Count interactions from same user in last minute
    SELECT COUNT(*) INTO recent_count
    FROM interactions
    WHERE user_id = NEW.user_id
    AND created_at > NOW() - INTERVAL '1 minute';
    
    -- Allow max 30 interactions per minute
    IF recent_count > 30 THEN
        RAISE EXCEPTION 'Rate limit exceeded. Please slow down.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS rate_limit_interactions ON interactions;
CREATE TRIGGER rate_limit_interactions
    BEFORE INSERT ON interactions
    FOR EACH ROW
    EXECUTE FUNCTION check_interaction_rate_limit();

-- ============================================
-- VERIFICATION: Check policies are active
-- ============================================
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('content', 'categories', 'regions', 'interactions');
