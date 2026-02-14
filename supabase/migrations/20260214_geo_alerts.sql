
-- 20260214_geo_alerts.sql

CREATE TABLE IF NOT EXISTS geo_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id), -- Changed from profiles(id) to auth.users(id) for standard supabase
  city TEXT,
  lat FLOAT,
  lng FLOAT,
  radius_km INTEGER DEFAULT 100,
  keywords TEXT[] DEFAULT ARRAY['fiesta', 'club', 'bar', 'evento', 'antros'],
  last_alert_sent TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster spatial queries (approximate via city/lat/lng if needed)
CREATE INDEX IF NOT EXISTS idx_geo_alerts_city ON geo_alerts(city);
CREATE INDEX IF NOT EXISTS idx_geo_alerts_active ON geo_alerts(is_active);
