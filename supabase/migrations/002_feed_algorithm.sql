-- ============================================
-- VENUZ Feed Algorithm - Migration ADAPTADA
-- Para tabla unificada 'content'
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. AÑADIR CAMPO trending_score SI NO EXISTE
-- (likes, views, rating ya existen en content)
-- ============================================
ALTER TABLE content ADD COLUMN IF NOT EXISTS trending_score INTEGER DEFAULT 0;

-- 2. CREAR TABLA DE PREFERENCIAS DE USUARIO
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  favorite_types TEXT[] DEFAULT '{}',
  favorite_categories TEXT[] DEFAULT '{}',
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  notification_radius INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- 3. CREAR TABLA DE INTERACCIONES
-- ============================================
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  action_type VARCHAR(20) NOT NULL,
  category VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_content ON user_interactions(content_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created ON user_interactions(created_at DESC);

-- 4. FUNCIÓN PARA INCREMENTAR VIEWS
-- ============================================
CREATE OR REPLACE FUNCTION increment_content_views(p_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE content SET views = COALESCE(views, 0) + 1 WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- 5. FUNCIÓN PARA TOGGLE LIKE
-- ============================================
CREATE OR REPLACE FUNCTION toggle_content_like(
  p_user_id UUID,
  p_content_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM user_interactions 
    WHERE user_id = p_user_id 
    AND content_id = p_content_id 
    AND action_type = 'like'
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM user_interactions 
    WHERE user_id = p_user_id 
    AND content_id = p_content_id 
    AND action_type = 'like';
    
    UPDATE content SET likes = GREATEST(0, COALESCE(likes, 0) - 1) WHERE id = p_content_id;
    RETURN FALSE;
  ELSE
    INSERT INTO user_interactions (user_id, content_id, action_type)
    VALUES (p_user_id, p_content_id, 'like');
    
    UPDATE content SET likes = COALESCE(likes, 0) + 1 WHERE id = p_content_id;
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. RLS POLICIES
-- ============================================
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (ignore errors if not exist)
DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can view own interactions" ON user_interactions;
DROP POLICY IF EXISTS "Users can create interactions" ON user_interactions;
DROP POLICY IF EXISTS "Public can create interactions" ON user_interactions;

CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own interactions" ON user_interactions
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Public can create interactions" ON user_interactions
  FOR INSERT WITH CHECK (true);

-- 7. TRIGGER PARA UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 8. INICIALIZAR LIKES/VIEWS CON VALORES RANDOM
-- ============================================
UPDATE content SET 
  likes = COALESCE(likes, 0) + floor(random() * 50 + 1)::int,
  views = COALESCE(views, 0) + floor(random() * 500 + 10)::int
WHERE likes = 0 OR views = 0;

-- ============================================
-- FIN DE MIGRATION
-- ============================================
