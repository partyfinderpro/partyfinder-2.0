
-- 20260214_integrated_affiliates.sql

CREATE TABLE IF NOT EXISTS integrated_affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES project_resources(id),
  feed_position_rule TEXT DEFAULT 'every_6', -- every_6, fixed_position, priority
  active BOOLEAN DEFAULT TRUE,
  integrated_at TIMESTAMPTZ DEFAULT NOW(),
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0
);

-- RLS
ALTER TABLE integrated_affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON integrated_affiliates
  FOR SELECT USING (true);

CREATE POLICY "Service role manages integrated affiliates" ON integrated_affiliates
  FOR ALL USING (auth.role() = 'service_role');
