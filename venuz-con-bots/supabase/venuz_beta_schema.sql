-- ============================================
-- VENUZ Beta Schema Update
-- Ejecutar en SQL Editor de Supabase
-- ============================================

-- 1. Tabla de Favoritos
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_content ON favorites(content_id);

-- 2. Tabla de Notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  content_id UUID REFERENCES content(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);

-- 3. Tabla de Push Subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);

-- 4. Agregar columnas faltantes a content (si no existen)
DO $$ 
BEGIN
  -- Columnas de geolocalización
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'lat') THEN
    ALTER TABLE content ADD COLUMN lat DOUBLE PRECISION;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'lng') THEN
    ALTER TABLE content ADD COLUMN lng DOUBLE PRECISION;
  END IF;
  
  -- Columnas de Google Places
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'rating') THEN
    ALTER TABLE content ADD COLUMN rating NUMERIC(3,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'total_ratings') THEN
    ALTER TABLE content ADD COLUMN total_ratings INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'is_open_now') THEN
    ALTER TABLE content ADD COLUMN is_open_now BOOLEAN;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'google_maps_url') THEN
    ALTER TABLE content ADD COLUMN google_maps_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'external_ids') THEN
    ALTER TABLE content ADD COLUMN external_ids JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'metadata') THEN
    ALTER TABLE content ADD COLUMN metadata JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'location_text') THEN
    ALTER TABLE content ADD COLUMN location_text TEXT;
  END IF;
END $$;

-- 5. Índices espaciales
CREATE INDEX IF NOT EXISTS idx_content_location 
ON content(lat, lng) 
WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- 6. Función para obtener lugares cercanos (con distancia)
CREATE OR REPLACE FUNCTION get_nearby_places(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 10000,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  image_url TEXT,
  category TEXT,
  source TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  location_text TEXT,
  rating NUMERIC,
  total_ratings INTEGER,
  is_open_now BOOLEAN,
  google_maps_url TEXT,
  distance_km DOUBLE PRECISION
) 
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    c.id,
    c.title,
    c.description,
    c.image_url,
    c.category,
    c.source,
    c.lat,
    c.lng,
    c.location_text,
    c.rating,
    c.total_ratings,
    c.is_open_now,
    c.google_maps_url,
    (
      6371 * acos(
        cos(radians(user_lat)) * cos(radians(c.lat)) *
        cos(radians(c.lng) - radians(user_lng)) +
        sin(radians(user_lat)) * sin(radians(c.lat))
      )
    ) as distance_km
  FROM content c
  WHERE 
    c.active = true
    AND c.lat IS NOT NULL 
    AND c.lng IS NOT NULL
    AND (
      6371 * acos(
        cos(radians(user_lat)) * cos(radians(c.lat)) *
        cos(radians(c.lng) - radians(user_lng)) +
        sin(radians(user_lat)) * sin(radians(c.lat))
      )
    ) * 1000 <= radius_meters
  ORDER BY distance_km ASC
  LIMIT limit_count;
$$;

-- 7. Enable RLS (Row Level Security)
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies para favorites
CREATE POLICY "Users can view own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Policies para notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies para push_subscriptions
CREATE POLICY "Users can manage own subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- 8. Trigger para actualizar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
