-- ============================================
-- VENUZ Feed Algorithm - Database Migration
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. AÑADIR CAMPOS DE ENGAGEMENT A TODAS LAS TABLAS
-- ============================================

-- Eventos
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2);
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS trending_score INTEGER DEFAULT 0;

-- Webcams
ALTER TABLE webcams ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE webcams ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE webcams ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2);
ALTER TABLE webcams ADD COLUMN IF NOT EXISTS trending_score INTEGER DEFAULT 0;

-- Escorts
ALTER TABLE escorts ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE escorts ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE escorts ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2);
ALTER TABLE escorts ADD COLUMN IF NOT EXISTS trending_score INTEGER DEFAULT 0;

-- Clubs
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS trending_score INTEGER DEFAULT 0;


-- 2. CREAR TABLA DE PREFERENCIAS DE USUARIO
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  favorite_types TEXT[] DEFAULT '{}',
  favorite_categories TEXT[] DEFAULT '{}',
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  notification_radius INTEGER DEFAULT 10, -- km
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);


-- 3. CREAR TABLA DE INTERACCIONES (para personalización)
-- ============================================
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  content_id UUID NOT NULL,
  content_type VARCHAR(20) NOT NULL, -- 'evento', 'webcam', 'escort', 'club'
  action_type VARCHAR(20) NOT NULL, -- 'view', 'like', 'unlike', 'share', 'click'
  category VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes para queries del algoritmo
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_content ON user_interactions(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created ON user_interactions(created_at DESC);


-- 4. FUNCIÓN PARA INCREMENTAR VIEWS
-- ============================================
CREATE OR REPLACE FUNCTION increment_views(
  p_table_name TEXT,
  p_id UUID
) RETURNS VOID AS $$
BEGIN
  EXECUTE format('UPDATE %I SET views = COALESCE(views, 0) + 1 WHERE id = $1', p_table_name)
  USING p_id;
END;
$$ LANGUAGE plpgsql;


-- 5. FUNCIÓN PARA TOGGLE LIKE
-- ============================================
CREATE OR REPLACE FUNCTION toggle_like(
  p_user_id UUID,
  p_content_id UUID,
  p_content_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Check if like exists
  SELECT EXISTS(
    SELECT 1 FROM user_interactions 
    WHERE user_id = p_user_id 
    AND content_id = p_content_id 
    AND action_type = 'like'
  ) INTO v_exists;

  IF v_exists THEN
    -- Unlike
    DELETE FROM user_interactions 
    WHERE user_id = p_user_id 
    AND content_id = p_content_id 
    AND action_type = 'like';
    
    EXECUTE format('UPDATE %I SET likes = GREATEST(0, COALESCE(likes, 0) - 1) WHERE id = $1', p_content_type || 's')
    USING p_content_id;
    
    RETURN FALSE;
  ELSE
    -- Like
    INSERT INTO user_interactions (user_id, content_id, content_type, action_type)
    VALUES (p_user_id, p_content_id, p_content_type, 'like');
    
    EXECUTE format('UPDATE %I SET likes = COALESCE(likes, 0) + 1 WHERE id = $1', p_content_type || 's')
    USING p_content_id;
    
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql;


-- 6. VISTA UNIFICADA DE TODO EL CONTENIDO (opcional, para queries más simples)
-- ============================================
CREATE OR REPLACE VIEW all_content AS
SELECT 
  id,
  'evento'::TEXT as type,
  nombre,
  descripcion,
  imagen_url,
  categoria,
  ubicacion,
  lat,
  lng,
  fecha_evento,
  NULL::DECIMAL as precio,
  likes,
  views,
  rating,
  trending_score,
  created_at
FROM eventos
UNION ALL
SELECT 
  id,
  'webcam'::TEXT as type,
  nombre,
  descripcion,
  imagen_url,
  categoria,
  NULL as ubicacion,
  NULL as lat,
  NULL as lng,
  NULL as fecha_evento,
  NULL as precio,
  likes,
  views,
  rating,
  trending_score,
  created_at
FROM webcams
UNION ALL
SELECT 
  id,
  'escort'::TEXT as type,
  nombre,
  descripcion,
  imagen_url,
  categoria,
  ubicacion,
  lat,
  lng,
  NULL as fecha_evento,
  precio,
  likes,
  views,
  rating,
  trending_score,
  created_at
FROM escorts
UNION ALL
SELECT 
  id,
  'club'::TEXT as type,
  nombre,
  descripcion,
  imagen_url,
  categoria,
  ubicacion,
  lat,
  lng,
  NULL as fecha_evento,
  NULL as precio,
  likes,
  views,
  rating,
  trending_score,
  created_at
FROM clubs;


-- 7. RLS POLICIES (Row Level Security)
-- ============================================
-- Habilitar RLS en tablas sensibles
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

-- Policy: usuarios solo pueden ver/editar sus propias preferencias
CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Policy: usuarios pueden ver sus propias interacciones
CREATE POLICY "Users can view own interactions" ON user_interactions
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: usuarios pueden crear interacciones
CREATE POLICY "Users can create interactions" ON user_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);


-- 8. TRIGGER PARA UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();


-- ============================================
-- FIN DE MIGRATION
-- ============================================
-- Ejecuta este script completo en Supabase SQL Editor
-- Verifica que no haya errores antes de continuar
