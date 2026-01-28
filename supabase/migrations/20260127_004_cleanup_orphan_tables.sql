-- ============================================
-- VENUZ MIGRATION 004: Cleanup Orphan Tables
-- Execute in Supabase SQL Editor
-- Date: 2026-01-27
-- ============================================

-- ⚠️ WARNING: Review each DROP carefully before executing!
-- This script consolidates duplicate/orphan tables

-- ========== STEP 1: Check for duplicates ==========
-- Run this SELECT first to verify what exists:
/*
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;
*/

-- ========== STEP 2: Merge user_profiles into profiles ==========

-- If both tables exist, migrate data from user_profiles to profiles
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') 
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        
        -- Insert from user_profiles to profiles (only if not exists)
        INSERT INTO profiles (id, created_at)
        SELECT id, created_at
        FROM user_profiles
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Migrated user_profiles data to profiles';
    END IF;
END $$;

-- ========== STEP 3: Drop orphan/unused tables ==========
-- Uncomment each line ONLY after verifying the table is truly unused

-- DROP TABLE IF EXISTS user_profiles CASCADE;
-- DROP TABLE IF EXISTS algorithm_insig CASCADE;
-- DROP TABLE IF EXISTS department_logs CASCADE;
-- DROP TABLE IF EXISTS scraper_logs CASCADE;

-- ========== STEP 4: Rename 'interactions' to standard if needed ==========
-- The schema shows 'interactions' but some code might use 'user_interactions'
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_interactions') 
       AND NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'interactions') THEN
        ALTER TABLE user_interactions RENAME TO interactions;
        RAISE NOTICE 'Renamed user_interactions to interactions';
    END IF;
END $$;

-- ========== STEP 5: Ensure FK consistency ==========

-- Add missing FK constraints if tables exist but constraints don't
DO $$
BEGIN
    -- content -> categories
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'content_category_id_fkey'
    ) THEN
        ALTER TABLE content 
        ADD CONSTRAINT content_category_id_fkey 
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
    END IF;
    
    -- content -> regions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'content_region_id_fkey'
    ) THEN
        ALTER TABLE content 
        ADD CONSTRAINT content_region_id_fkey 
        FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ========== STEP 6: Create missing tables if needed ==========

-- Favorites table (if not exists)
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_content ON favorites(content_id);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "favorites_read_own" ON favorites
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "favorites_insert_own" ON favorites
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "favorites_delete_own" ON favorites
    FOR DELETE USING (user_id = auth.uid());

-- ========== STEP 7: Update statistics ==========
ANALYZE content;
ANALYZE categories;
ANALYZE regions;
ANALYZE interactions;

-- ============================================
-- FINAL VERIFICATION
-- ============================================
/*
-- Check final table list
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check content table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'content'
ORDER BY ordinal_position;
*/
