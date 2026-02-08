-- ============================================
-- VENUZ SCE Phase 2: EventBrain + GuardianBrain
-- Tablas adicionales para fuentes externas y monitoreo
-- ============================================

-- 1. Tabla de Fuentes Externas (Ticketmaster, FB, etc.)
CREATE TABLE IF NOT EXISTS external_event_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name text NOT NULL UNIQUE,  -- 'ticketmaster', 'facebook', 'eventbrite'
  last_success timestamptz,
  failure_count int DEFAULT 0,
  is_active boolean DEFAULT true,
  config jsonb, -- Parametros extra (API keys, IDs, etc)
  created_at timestamptz DEFAULT now()
);

-- Insertar fuentes iniciales
INSERT INTO external_event_sources (source_name, config)
VALUES 
('ticketmaster', '{"countryCode": "MX", "classificationName": "music,arts,sports"}'::jsonb),
('facebook_pvr', '{"target": "Puerto Vallarta", "type": "public_events"}'::jsonb)
ON CONFLICT (source_name) DO NOTHING;


-- 2. Asegurar que system_logs tenga los índices correctos (si ya existe, no hará nada malo)
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created ON system_logs(created_at DESC);

-- Enable RLS
ALTER TABLE external_event_sources ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Service role full access sources" ON external_event_sources
  FOR ALL USING (auth.role() = 'service_role');
