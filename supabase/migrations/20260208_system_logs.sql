-- ============================================
-- VENUZ SCE Phase 2: GuardianBrain Logs
-- system_logs table
-- ============================================

CREATE TABLE IF NOT EXISTS system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text,  -- info, update, warning, error
  message text,
  data jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_created ON system_logs(created_at DESC);

-- Enable RLS
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access logs" ON system_logs
  FOR ALL USING (auth.role() = 'service_role');
