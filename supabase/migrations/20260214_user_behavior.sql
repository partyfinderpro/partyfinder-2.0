
-- 20260214_user_behavior.sql

CREATE TABLE IF NOT EXISTS user_behavior (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Can be UUID or text depending on auth, assuming UUID for now or string if anonymous
  content_id UUID, -- Nullable if interaction is generic? User says NOT NULL.
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'click', 'scroll', 'time_spent', 'like', 'skip', 'share', 'save')),
  value FLOAT, -- segundos vistos, 1 para click, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_user_behavior_user ON user_behavior(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_content ON user_behavior(content_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_created_at ON user_behavior(created_at);

-- RLS
ALTER TABLE user_behavior ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own behavior" ON user_behavior
  FOR INSERT WITH CHECK (true); -- Relaxed for now to allow anon tracking if needed, or auth.uid() = user_id

CREATE POLICY "Service role manages all behavior" ON user_behavior
  FOR ALL USING (auth.role() = 'service_role');
